<?php
namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\InsuranceType;
use App\Models\MedicalService;
use App\Models\Laboratory\LabSample;
use App\Models\Laboratory\LabSampleCollection;
use App\Models\Laboratory\LabSampleType;
use App\Models\Laboratory\LabTestProfile;
use App\Models\Laboratory\LabTestRequest;
use App\Models\Patient;
use App\Models\Professional;
use App\Models\ServiceCategory;
use App\Models\ServiceRequestDetail;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LabSampleController extends Controller
{
    private const ACTIVE_TEST_REQUEST_STATUSES = [
        'pending',
        'assigned',
        'in_process',
        'completed',
        'referred_sent',
        'external_result_received',
        'not_performed',
    ];

    public function index(Request $request): Response
    {
        $today = now()->toDateString();
        $dateFrom = $request->string('date_from')->toString() ?: $today;
        $dateTo = $request->string('date_to')->toString() ?: $today;
        $status = $request->string('status')->toString();
        $query = LabSample::query();

        if ($request->search) {
            $search = $request->string('search')->toString();
            $query->where(function ($sampleQuery) use ($search) {
                $sampleQuery->where('sample_number', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($patientQuery) use ($search) {
                        $patientQuery
                            ->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('serviceRequestDetail.medicalService', function ($serviceQuery) use ($search) {
                        $serviceQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($request->sample_type_id) {
            $query->where('lab_sample_type_id', $request->sample_type_id);
        }

        $query->where(function ($dateQuery) use ($dateFrom, $dateTo) {
            $dateQuery
                ->where(function ($collectedQuery) use ($dateFrom, $dateTo) {
                    $collectedQuery
                        ->whereNotNull('collected_at')
                        ->whereDate('collected_at', '>=', $dateFrom)
                        ->whereDate('collected_at', '<=', $dateTo);
                })
                ->orWhere(function ($pendingQuery) use ($dateFrom, $dateTo) {
                    $pendingQuery
                        ->whereNull('collected_at')
                        ->whereDate('created_at', '>=', $dateFrom)
                        ->whereDate('created_at', '<=', $dateTo);
                });
        });

        $samples = $query
            ->with([
                'serviceRequestDetail.medicalService',
                'patient',
                'sampleType',
                'receivedBy',
                'latestCollection',
                'testRequests.externalLaboratory',
            ])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $sampleTypes = LabSampleType::active()->orderBy('name')->get();

        return Inertia::render('laboratory/samples/Index', [
            'samples' => $samples,
            'sampleTypes' => $sampleTypes,
            'filters' => [
                'search' => $request->string('search')->toString() ?: null,
                'status' => $status !== '' ? $status : null,
                'sample_type_id' => $request->string('sample_type_id')->toString() ?: null,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('laboratory/create/Create', [
            'patients' => [],
            'medicalServices' => $this->mapMedicalServices(),
            'professionals' => $this->mapProfessionals(),
            'insuranceTypes' => $this->mapInsuranceTypes(),
        ]);
    }

    /**
     * Map active professionals for dropdown selection.
     * @return array
     */
    private function mapProfessionals(): array
    {
        return Professional::where('status', 'active')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get()
            ->map(function ($professional) {
                return [
                    'value' => $professional->id,
                    'id' => $professional->id,
                    'label' => $professional->full_name,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Map active insurance types for dropdown selection.
     * @return array
     */
    private function mapInsuranceTypes(): array
    {
        return InsuranceType::where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(function ($insurance) {
                return [
                    'value' => $insurance->id,
                    'id' => $insurance->id,
                    'label' => $insurance->name,
                    'name' => $insurance->name,
                    'description' => $insurance->description,
                    'coverage_percentage' => $insurance->coverage_percentage,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Map medical services grouped by category for hierarchical selection.
     * @return array
     */
    private function mapMedicalServices(): array
    {
        $labRootId = ServiceCategory::where('name', 'Laboratorio Clínico')
            ->whereNull('parent_id')
            ->value('id');

        return ServiceCategory::query()
            ->where('status', 'active')
            ->when($labRootId, fn ($q) => $q->where('parent_id', $labRootId))
            ->with(['medicalServices' => function ($query) {
                $query->where('status', 'active')->orderBy('name');
            }])
            ->orderBy('name')
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'category' => $category->name,
                    'services' => $category->medicalServices->map(function (MedicalService $service) {
                        return [
                            'value' => $service->id,
                            'id' => $service->id,
                            'label' => $service->name,
                            'name' => $service->name,
                            'code' => $service->code,
                            'base_price' => $service->base_price ?? 0,
                            'estimated_duration' => $service->duration_minutes ?? 30,
                        ];
                    })->values()->all(),
                ];
            })
            ->filter(fn ($category) => !empty($category['services']))
            ->values()
            ->all();
    }

    /**
     * Creación masiva de muestras desde el carrito de solicitud de laboratorio.
     * Crea múltiples muestras y, si se indica perfil de prueba, crea el test request asociado.
     */
    public function bulkStore(Request $request): RedirectResponse
    {
        $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'priority'   => 'required|in:routine,urgent,stat',
            'notes'      => 'nullable|string',
            'samples'    => 'required|array|min:1',
            'samples.*.lab_sample_type_id'  => 'required|exists:lab_sample_types,id',
            'samples.*.lab_test_profile_id' => 'nullable|exists:lab_test_profiles,id',
            'samples.*.assigned_to_user_id' => 'nullable|exists:users,id',
            'samples.*.barcode'             => 'nullable|string|max:100',
            'samples.*.collected_at'        => 'required|date',
            'samples.*.quantity'            => 'required|integer|min:1|max:20',
            'samples.*.notes'               => 'nullable|string',
        ]);

        DB::transaction(function () use ($request) {
            foreach ($request->samples as $sampleData) {
                $sampleNumber = 'LAB-' . strtoupper(uniqid());

                $sample = LabSample::create([
                    'patient_id'         => $request->patient_id,
                    'lab_sample_type_id' => $sampleData['lab_sample_type_id'],
                    'sample_number'      => $sampleNumber,
                    'barcode'            => $sampleData['barcode'] ?? null,
                    'collected_at'       => $sampleData['collected_at'],
                    'received_at'        => now(),
                    'received_by'        => auth()->id(),
                    'status'             => 'received',
                    'remarks'            => $sampleData['notes'] ?? null,
                ]);

                if (!empty($sampleData['lab_test_profile_id'])) {
                    LabTestRequest::create([
                        'lab_sample_id'       => $sample->id,
                        'lab_test_profile_id' => $sampleData['lab_test_profile_id'],
                        'requested_by'        => auth()->id(),
                        'assigned_to_user_id' => !empty($sampleData['assigned_to_user_id']) ? (int) $sampleData['assigned_to_user_id'] : null,
                        'priority'            => $request->priority,
                        'status'              => !empty($sampleData['assigned_to_user_id']) ? 'assigned' : 'pending',
                        'notes'               => $request->notes ?? null,
                    ]);
                }
            }
        });

        return redirect()
            ->route('medical.laboratory.samples.index')
            ->with('success', 'Muestras registradas exitosamente.');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'service_request_detail_id' => 'nullable|exists:service_request_details,id',
            'patient_id' => 'required|exists:patients,id',
            'lab_sample_type_id' => 'required|exists:lab_sample_types,id',
            'sample_number' => 'required|string|max:50|unique:lab_samples,sample_number',
            'barcode' => 'nullable|string|max:100|unique:lab_samples,barcode',
            'collected_at' => 'required|date',
            'received_at' => 'nullable|date',
            'remarks' => 'nullable|string',
        ]);

        $validated['received_by'] = auth()->id();
        $validated['status'] = 'received';

        if (!isset($validated['received_at'])) {
            $validated['received_at'] = now();
        }

        LabSample::create($validated);

        return redirect()
            ->route('laboratory.samples.index')
            ->with('success', 'Muestra registrada exitosamente.');
    }

    public function show(LabSample $sample): Response
    {
        $sample->load([
            'serviceRequestDetail',
            'patient',
            'sampleType',
            'receivedBy',
            'testRequests.testProfile',
            'results',
            'validation',
        ]);

        return Inertia::render('laboratory/samples/Show', [
            'sample' => $sample,
        ]);
    }

    public function showCollectForm(LabSample $sample): Response
    {
        $sample->load([
            'patient',
            'sampleType',
            'serviceRequestDetail.medicalService',
            'serviceRequestDetail.professional',
            'serviceRequestDetail.serviceRequest.details.medicalService',
        ]);

        /** @var \App\Models\ServiceRequest|null $serviceRequest */
        $serviceRequest = $sample->serviceRequestDetail?->serviceRequest;
        /** @var Patient|null $patient */
        $patient = $sample->patient;
        $requestedStudy = $sample->serviceRequestDetail?->medicalService?->name;
        $latestCollection = $sample->collections()
            ->orderByDesc('collected_at')
            ->orderByDesc('id')
            ->first();

        $sampleTypes = LabSampleType::active()
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'container_type'])
            ->values();

        $sampleTypeIdsByCode = $sampleTypes
            ->pluck('id', 'code')
            ->mapWithKeys(fn ($id, $code) => [(string) $code => (int) $id])
            ->all();

        $suggestedSampleTypeId = $this->inferSampleTypeIdFromStudyName($requestedStudy, $sampleTypeIdsByCode);
        $effectiveSampleTypeId = $sample->lab_sample_type_id ?: $suggestedSampleTypeId;
        $suggestedSampleTypeName = $sampleTypes->firstWhere('id', $effectiveSampleTypeId)?->name;

        $studies = $serviceRequest
            ? $serviceRequest->details->map(function (ServiceRequestDetail $detail) {
                return [
                    'id' => $detail->id,
                    'name' => $detail->medicalService?->name,
                ];
            })->values()->all()
            : [];

        $patientAge = null;
        if ($patient && $patient->birth_date) {
            $patientAge = $patient->birth_date->age;
        }

        return Inertia::render('laboratory/samples/Collect', [
            'sample' => [
                'id' => $sample->id,
                'sample_number' => $sample->sample_number,
                'status' => $sample->status,
                'patient' => $patient ? [
                    'id' => $patient->id,
                    'full_name' => $patient->full_name,
                    'document' => $patient->document_number,
                    'age' => $patientAge,
                    'gender' => $patient->gender,
                ] : null,
                'request' => $serviceRequest ? [
                    'id' => $serviceRequest->id,
                    'request_number' => $serviceRequest->request_number,
                    'priority' => $serviceRequest->priority,
                ] : null,
                'requesting_professional' => $sample->serviceRequestDetail?->professional?->full_name,
                'requested_study' => $requestedStudy,
                'studies' => $studies,
                'current_sample_type' => $sample->sampleType?->name,
                'current_sample_type_id' => $sample->lab_sample_type_id,
                'suggested_sample_type_id' => $effectiveSampleTypeId,
                'suggested_sample_type_name' => $suggestedSampleTypeName,
                'barcode' => $sample->barcode,
                'initial_collection' => $latestCollection ? [
                    'collected_at' => $latestCollection->collected_at,
                    'container_type' => $latestCollection->container_type,
                    'volume' => $latestCollection->volume,
                    'volume_unit' => $latestCollection->volume_unit,
                    'sample_condition' => $latestCollection->sample_condition,
                    'collection_site' => $latestCollection->collection_site,
                    'collection_notes' => $latestCollection->collection_notes,
                ] : null,
            ],
            'sampleTypes' => $sampleTypes,
        ]);
    }

    public function showStartAnalysisForm(LabSample $sample): Response
    {
        $sample->load([
            'patient',
            'sampleType',
            'serviceRequestDetail.medicalService',
            'testRequests.testProfile',
        ]);

        $testRequest = $sample->testRequests()
            ->whereIn('status', self::ACTIVE_TEST_REQUEST_STATUSES)
            ->with('testProfile')
            ->latest('id')
            ->first();

        $latestTestRequest = $sample->testRequests()
            ->with('testProfile')
            ->latest('id')
            ->first();

        $suggestedProfile = null;
        if (!$testRequest) {
            $suggestedProfile = $this->resolveTestProfileForService($sample->serviceRequestDetail);
        }

        $isValidated = in_array($sample->status, ['validated', 'reported', 'completed'], true)
            || ($latestTestRequest && $latestTestRequest->status === 'validated');

        $canStart = true;
        $blockingReason = null;

        if (!auth()->user()?->can('start-lab-analysis')) {
            $canStart = false;
            $blockingReason = 'No tiene permisos para iniciar análisis de laboratorio.';
        } elseif ($isValidated) {
            $canStart = false;
            $blockingReason = 'El análisis ya fue validado por bioquímica. No se permite edición posterior.';
        } elseif (!in_array($sample->status, ['received', 'in_analysis', 'pending_validation'], true)) {
            $canStart = false;
            $blockingReason = 'Solo se puede iniciar o editar análisis en muestras recibidas, en análisis o pendientes de validación.';
        } elseif (!$testRequest && !$suggestedProfile) {
            $canStart = false;
            $blockingReason = 'El servicio solicitado no tiene perfil configurado. Configure o edite perfiles en Laboratorio > Perfiles.';
        }

        return Inertia::render('laboratory/samples/StartAnalysis', [
            'sample' => [
                'id' => $sample->id,
                'sample_number' => $sample->sample_number,
                'status' => $sample->status,
                'patient_name' => $sample->patient?->full_name,
                'sample_type' => $sample->sampleType?->name,
                'requested_study' => $sample->serviceRequestDetail?->medicalService?->name,
            ],
            'testRequest' => $testRequest ? [
                'id' => $testRequest->id,
                'status' => $testRequest->status,
                'profile_name' => $testRequest->testProfile?->name,
            ] : null,
            'latestTestRequest' => $latestTestRequest ? [
                'id' => $latestTestRequest->id,
                'status' => $latestTestRequest->status,
                'profile_name' => $latestTestRequest->testProfile?->name,
            ] : null,
            'suggestedProfile' => $suggestedProfile ? [
                'id' => $suggestedProfile->id,
                'name' => $suggestedProfile->name,
                'code' => $suggestedProfile->code,
            ] : null,
            'canStart' => $canStart,
            'blockingReason' => $blockingReason,
        ]);
    }

    private function inferSampleTypeIdFromStudyName(?string $studyName, array $sampleTypeIdsByCode): ?int
    {
        if (!$studyName) {
            return null;
        }

        $name = Str::lower($studyName);

        if (str_contains($name, 'orina')) {
            return $sampleTypeIdsByCode['URINE'] ?? $sampleTypeIdsByCode['URINE24H'] ?? null;
        }

        if (str_contains($name, 'heces') || str_contains($name, 'copro')) {
            return $sampleTypeIdsByCode['STOOL'] ?? null;
        }

        if (str_contains($name, 'esputo')) {
            return $sampleTypeIdsByCode['SPUTUM'] ?? null;
        }

        if (str_contains($name, 'hisopado') && str_contains($name, 'nas')) {
            return $sampleTypeIdsByCode['NASAL_SWAB'] ?? null;
        }

        if (str_contains($name, 'hisopado') || str_contains($name, 'farin')) {
            return $sampleTypeIdsByCode['THROAT_SWAB'] ?? null;
        }

        if (str_contains($name, 'lcr') || str_contains($name, 'cefalorra')) {
            return $sampleTypeIdsByCode['CSF'] ?? null;
        }

        if (str_contains($name, 'sinov')) {
            return $sampleTypeIdsByCode['SYNOVIAL'] ?? null;
        }

        if (str_contains($name, 'biops')) {
            return $sampleTypeIdsByCode['BIOPSY'] ?? null;
        }

        if (str_contains($name, 'coagul') || str_contains($name, 'plasma')) {
            return $sampleTypeIdsByCode['PLASMA'] ?? null;
        }

        if (str_contains($name, 'suero')) {
            return $sampleTypeIdsByCode['SERUM'] ?? null;
        }

        return $sampleTypeIdsByCode['BLOOD'] ?? null;
    }

    private function resolveTestProfileForService(?ServiceRequestDetail $detail): ?LabTestProfile
    {
        if (!$detail || !$detail->medical_service_id) {
            return null;
        }

        $directProfile = LabTestProfile::query()
            ->where('medical_service_id', $detail->medical_service_id)
            ->where('status', 'active')
            ->first();

        if ($directProfile) {
            return $directProfile;
        }

        $studyName = Str::lower((string) ($detail->medicalService?->name ?? ''));
        if ($studyName === '') {
            return null;
        }

        $candidateNames = [];

        if (str_contains($studyName, 'hemograma')) {
            $candidateNames[] = 'Hemograma Completo';
        }

        if (str_contains($studyName, 'gluc')) {
            $candidateNames[] = 'Glucemia';
        }

        if (str_contains($studyName, 'lipid') || str_contains($studyName, 'colesterol') || str_contains($studyName, 'triglicer')) {
            $candidateNames[] = 'Perfil Lipídico';
        }

        if (str_contains($studyName, 'coagul') || str_contains($studyName, 'inr') || str_contains($studyName, 'tppa')) {
            $candidateNames[] = 'Coagulograma';
        }

        if (str_contains($studyName, 'orina') || str_contains($studyName, 'uroan')) {
            $candidateNames[] = 'Orina Completa';
        }

        if (str_contains($studyName, 'hepat') || str_contains($studyName, 'tgo') || str_contains($studyName, 'tgp') || str_contains($studyName, 'ggt')) {
            $candidateNames[] = 'Hepatograma';
        }

        if (str_contains($studyName, 'ren') || str_contains($studyName, 'creatin') || str_contains($studyName, 'urea')) {
            $candidateNames[] = 'Función Renal';
        }

        foreach ($candidateNames as $candidateName) {
            $profile = LabTestProfile::query()
                ->where('status', 'active')
                ->where('name', $candidateName)
                ->first();

            if ($profile) {
                return $profile;
            }
        }

        return null;
    }

    public function edit(LabSample $sample): Response
    {
        $sampleTypes = LabSampleType::active()->orderBy('name')->get();
        $patients = Patient::where('status', 'active')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        return Inertia::render('laboratory/samples/Edit', [
            'sample' => $sample,
            'sampleTypes' => $sampleTypes,
            'patients' => $patients,
        ]);
    }

    public function update(Request $request, LabSample $sample): RedirectResponse
    {
        $validated = $request->validate([
            'service_request_detail_id' => 'nullable|exists:service_request_details,id',
            'patient_id' => 'required|exists:patients,id',
            'lab_sample_type_id' => 'required|exists:lab_sample_types,id',
            'sample_number' => ['required', 'string', 'max:50', Rule::unique('lab_samples')->ignore($sample->id)],
            'barcode' => ['nullable', 'string', 'max:100', Rule::unique('lab_samples')->ignore($sample->id)],
            'collected_at' => 'required|date',
            'received_at' => 'nullable|date',
            'status' => ['required', Rule::in([
                'pending',
                'pending_collection',
                'collected',
                'received',
                'processing',
                'in_analysis',
                'pending_validation',
                'validated',
                'completed',
                'reported',
                'rejected',
                'cancelled',
            ])],
            'remarks' => 'nullable|string',
        ]);

        $sample->update($validated);

        return redirect()
            ->route('laboratory.samples.index')
            ->with('success', 'Muestra actualizada exitosamente.');
    }

    public function collect(Request $request, LabSample $sample): RedirectResponse
    {
        if (!in_array($sample->status, ['pending', 'pending_collection', 'collected'], true)) {
            return redirect()
                ->back()
                ->with('error', 'Solo se puede registrar o editar la toma en estado pendiente o tomada.');
        }

        $validated = $request->validate([
            'collected_at' => ['nullable', 'date'],
            'lab_sample_type_id' => ['nullable', 'exists:lab_sample_types,id'],
            'container_type' => ['nullable', 'string', 'max:100'],
            'volume' => ['nullable', 'numeric', 'min:0'],
            'volume_unit' => ['nullable', 'string', 'max:20'],
            'sample_condition' => ['nullable', 'string', 'max:50'],
            'collection_site' => ['nullable', 'string', 'max:100'],
            'collection_notes' => ['nullable', 'string'],
            'barcode' => ['nullable', 'string', 'max:100'],
        ]);

        $sampleTypeId = isset($validated['lab_sample_type_id']) && $validated['lab_sample_type_id'] !== null
            ? (int) $validated['lab_sample_type_id']
            : null;
        $sampleType = $sampleTypeId ? LabSampleType::query()->find($sampleTypeId) : null;
        $isEditingCollection = $sample->status === 'collected';

        DB::transaction(function () use ($sample, $validated, $sampleType, $sampleTypeId, $isEditingCollection) {
            $payload = [
                'collected_by' => auth()->id(),
                'collected_at' => $validated['collected_at'] ?? $sample->collected_at,
                'sample_type' => $sampleType?->name,
                'container_type' => $validated['container_type'] ?? null,
                'volume' => $validated['volume'] ?? null,
                'volume_unit' => $validated['volume_unit'] ?? null,
                'sample_condition' => $validated['sample_condition'] ?? null,
                'collection_site' => $validated['collection_site'] ?? null,
                'collection_notes' => $validated['collection_notes'] ?? null,
            ];

            if ($isEditingCollection) {
                $latestCollection = $sample->collections()
                    ->orderByDesc('collected_at')
                    ->orderByDesc('id')
                    ->first();

                if ($latestCollection) {
                    $latestCollection->update($payload);
                } else {
                    LabSampleCollection::create([
                        'lab_sample_id' => $sample->id,
                        ...$payload,
                    ]);
                }
            } else {
                LabSampleCollection::create([
                    'lab_sample_id' => $sample->id,
                    ...$payload,
                ]);
            }

            $sample->update([
                'status' => 'collected',
                'lab_sample_type_id' => $sampleTypeId ?? $sample->lab_sample_type_id,
                'collected_at' => $validated['collected_at'] ?? $sample->collected_at,
                'collected_by' => auth()->id(),
                'barcode' => $validated['barcode'] ?? $sample->barcode,
            ]);
        });

        return redirect()
            ->route('medical.laboratory.samples.index')
            ->with('success', $isEditingCollection ? 'Toma de muestra actualizada correctamente.' : 'Muestra tomada correctamente.');
    }

    public function receive(LabSample $sample): RedirectResponse
    {
        if ($sample->status !== 'collected') {
            return redirect()
                ->back()
                ->with('error', 'Solo se pueden recibir muestras en estado tomada.');
        }

        $sample->update([
            'status' => 'received',
            'received_at' => now(),
            'received_by' => auth()->id(),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Muestra recibida correctamente.');
    }

    public function reject(Request $request, LabSample $sample): RedirectResponse
    {
        if (!in_array($sample->status, ['collected', 'received'], true)) {
            return redirect()
                ->back()
                ->with('error', 'Solo se pueden rechazar muestras tomadas o recibidas.');
        }

        $validated = $request->validate([
            'remarks' => ['required', 'string', 'max:1000'],
        ]);

        $sample->update([
            'status' => 'rejected',
            'remarks' => $validated['remarks'],
        ]);

        return redirect()
            ->back()
            ->with('success', 'Muestra rechazada correctamente.');
    }

    public function startAnalysis(LabSample $sample): RedirectResponse
    {
        if (!auth()->user()?->can('start-lab-analysis')) {
            return redirect()
                ->back()
                ->with('error', 'No tiene permisos para iniciar análisis de laboratorio.');
        }

        if (in_array($sample->status, ['validated', 'reported', 'completed'], true)) {
            return redirect()
                ->back()
                ->with('error', 'El análisis ya fue validado por bioquímica. No se permite edición posterior.');
        }

        if (!in_array($sample->status, ['received', 'in_analysis', 'pending_validation'], true)) {
            return redirect()
                ->back()
                ->with('error', 'Solo se puede iniciar o editar análisis en muestras recibidas, en análisis o pendientes de validación.');
        }

        $sample->load(['serviceRequestDetail.medicalService', 'testRequests']);

        $latestRequest = $sample->testRequests()
            ->latest('id')
            ->first();

        if ($latestRequest && $latestRequest->status === 'validated') {
            return redirect()
                ->back()
                ->with('error', 'La solicitud ya fue validada por bioquímica. No se permite edición posterior.');
        }

        $testRequest = $sample->testRequests()
            ->whereIn('status', self::ACTIVE_TEST_REQUEST_STATUSES)
            ->latest('id')
            ->first();

        if (!$testRequest) {
            if ($sample->status !== 'received') {
                return redirect()
                    ->back()
                    ->with('error', 'No existe una solicitud activa para continuar este análisis.');
            }

            $detail = $sample->serviceRequestDetail;
            if (!$detail || !$detail->medical_service_id) {
                return redirect()
                    ->back()
                    ->with('error', 'No hay solicitud de servicio asociada a esta muestra.');
            }

            $testProfile = $this->resolveTestProfileForService($detail);

            if (!$testProfile) {
                return redirect()
                    ->back()
                    ->with('error', 'El servicio solicitado no tiene perfil configurado. Configure o edite perfiles en Laboratorio > Perfiles (/medical/laboratory/test-profiles).');
            }

            $testRequest = DB::transaction(function () use ($sample, $detail, $testProfile) {
                $assignedToUserId = null;
                
                if ($detail->professional_id) {
                    $professional = Professional::query()->find($detail->professional_id);
                    $assignedToUserId = $professional?->user_id;
                }

                return LabTestRequest::create([
                    'lab_sample_id' => $sample->id,
                    'lab_test_profile_id' => $testProfile->id,
                    'requested_by' => auth()->id(),
                    'assigned_to_user_id' => $assignedToUserId,
                    'status' => 'pending',
                    'notes' => 'Auto-creada al iniciar análisis',
                ]);
            });
        }

        if ($sample->status === 'received') {
            $sample->update(['status' => 'in_analysis']);
        }

        if (in_array($testRequest->status, ['pending', 'assigned'], true)) {
            $testRequest->update([
                'status' => 'in_process',
                'started_at' => $testRequest->started_at ?? now(),
            ]);
        }

        return redirect()
            ->route('medical.laboratory.results.create', ['test_request_id' => $testRequest->id])
            ->with('success', 'Análisis iniciado. Complete los parámetros del estudio.');
    }

    public function destroy(LabSample $sample): RedirectResponse
    {
        if ($sample->testRequests()->count() > 0) {
            return redirect()
                ->back()
                ->with('error', 'No se puede eliminar. Hay solicitudes de prueba asociadas.');
        }

        $sample->delete();

        return redirect()
            ->route('laboratory.samples.index')
            ->with('success', 'Muestra eliminada exitosamente.');
    }
}
