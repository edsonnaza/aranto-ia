<?php
namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Professional;
use App\Models\Laboratory\ExternalLaboratory;
use App\Models\Laboratory\LabEquipment;
use App\Models\Laboratory\LabResult;
use App\Models\Laboratory\LabSample;
use App\Models\Laboratory\LabTestRequest;
use App\Models\Laboratory\LabTestRequestAttachment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LabResultController extends Controller
{
    private function resolveAuthorizedSigner(): ?Professional
    {
        if (! (auth()->user()?->hasPermissionTo('validate-lab-results') ?? false)) {
            return null;
        }

        return Professional::query()
            ->where('user_id', auth()->id())
            ->where('is_lab_signer', true)
            ->first();
    }

    public function create(Request $request): Response
    {
        $testRequests = LabTestRequest::query()
            ->whereIn('status', ['pending', 'assigned', 'in_process', 'completed', 'referred_pending', 'referred_sent', 'external_result_received'])
            ->with([
                'sample.patient',
                'externalLaboratory',
                'attachments',
                'testProfile.parameters.referenceRanges',
                'testProfile.parameters.equipmentParameterRanges',
                'testProfile.profileEquipments.equipment',
            ])
            ->orderByDesc('id')
            ->get();

        $equipments = LabEquipment::where('status', 'active')
            ->orderBy('name')
            ->get();

        $externalLaboratories = ExternalLaboratory::query()
            ->active()
            ->orderBy('name')
            ->get(['id', 'name', 'contact_name', 'phone', 'whatsapp', 'email']);

        $initialTestRequestId = $request->integer('test_request_id') ?: null;

        $existingResults = [];
        if ($initialTestRequestId) {
            $existingResults = LabResult::where('lab_test_request_id', $initialTestRequestId)
                ->where('status', 'draft')
                ->get(['lab_test_parameter_id', 'value', 'equipment_id'])
                ->keyBy('lab_test_parameter_id')
                ->map(fn ($r) => ['value' => $r->value, 'equipment_id' => $r->equipment_id])
                ->all();
        }

        return Inertia::render('laboratory/results/Create', [
            'testRequests' => $testRequests,
            'equipments' => $equipments,
            'externalLaboratories' => $externalLaboratories,
            'initialTestRequestId' => $initialTestRequestId,
            'existingResults' => $existingResults,
        ]);
    }

    public function index(Request $request): Response
    {
        $authorizedSigner = $this->resolveAuthorizedSigner();
        $today = now()->toDateString();
        $dateFrom = $request->string('date_from')->toString() ?: $today;
        $dateTo = $request->string('date_to')->toString() ?: $today;
        $status = $request->string('status')->toString() ?: 'validated';

        $query = LabResult::query();

        if ($request->search) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->whereHas('sample', function ($sampleQuery) use ($search) {
                    $sampleQuery
                        ->where('sample_number', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%")
                        ->orWhereHas('patient', function ($patientQuery) use ($search) {
                            $patientQuery
                                ->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%");
                        });
                })->orWhereHas('testRequest.testProfile', function ($profileQuery) use ($search) {
                    $profileQuery->where('name', 'like', "%{$search}%");
                });
            });
        }

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $query->whereDate('updated_at', '>=', $dateFrom);
        $query->whereDate('updated_at', '<=', $dateTo);

        $results = $query
            ->with([
                'sample.patient',
                'sample.report',
                'sample.sampleType',
                'testRequest.testProfile',
                'testRequest.externalLaboratory',
                'testRequest.attachments',
                'parameter',
                'equipment',
                'enteredBy',
            ])
            ->latest()
            ->get();

        $externalLaboratories = ExternalLaboratory::query()
            ->active()
            ->orderBy('name')
            ->get(['id', 'name', 'contact_name', 'phone', 'whatsapp', 'email']);

        $testRequests = LabTestRequest::query()
            ->whereIn('status', ['pending', 'assigned', 'in_process'])
            ->with([
                'sample.patient',
                'testProfile.parameters.referenceRanges',
                'testProfile.parameters.equipmentParameterRanges',
                'testProfile.profileEquipments.equipment',
            ])
            ->orderByDesc('id')
            ->get();

        $equipments = LabEquipment::where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('laboratory/results/Index', [
            'results' => [
                'data' => $results,
            ],
            'filters' => [
                'search' => $request->string('search')->toString() ?: null,
                'status' => $status,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'externalLaboratories' => $externalLaboratories,
            'canValidate' => $authorizedSigner !== null,
            'validationAuthorizationMessage' => $authorizedSigner
                ? null
                : 'Solo el bioquímico autorizado con firma habilitada puede validar resultados y cerrar el estudio.',
        ]);
    }

    public function storeBatch(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'lab_test_request_id' => 'required|exists:lab_test_requests,id',
            'equipment_id' => 'nullable|exists:lab_equipments,id',
            'processing_mode' => ['required', Rule::in(['internal', 'referred'])],
            'referred_status' => ['nullable', Rule::in(['referred_sent', 'external_result_received', 'not_performed'])],
            'external_laboratory_id' => ['nullable', 'exists:external_laboratories,id'],
            'external_reference_number' => ['nullable', 'string', 'max:120'],
            'expected_result_at' => ['nullable', 'date'],
            'processing_notes' => ['nullable', 'string'],
            'not_performed_reason' => ['nullable', 'string'],
            'include_external_attachments_in_medical_history' => ['nullable', 'boolean'],
            'external_reports' => ['nullable', 'array'],
            'external_reports.*' => ['file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
            'external_report_titles' => ['nullable', 'array'],
            'external_report_titles.*' => ['nullable', 'string', 'max:150'],
            'status' => ['required', Rule::in(['draft', 'validated'])],
            'results' => ['nullable', 'array'],
            'results.*.lab_test_parameter_id' => ['required', 'exists:lab_test_parameters,id'],
            'results.*.value' => ['nullable', 'string', 'max:255'],
            'results.*.is_out_of_range' => ['nullable', 'boolean'],
        ]);

        $testRequest = LabTestRequest::query()
            ->with('testProfile.parameters', 'testProfile.profileEquipments', 'attachments')
            ->findOrFail((int) $validated['lab_test_request_id']);

        $this->validateEquipmentForTestRequest(
            $testRequest,
            isset($validated['equipment_id']) ? (int) $validated['equipment_id'] : null,
        );

        $allowedParameterIds = $testRequest->testProfile
            ? $testRequest->testProfile->parameters->pluck('id')->map(fn ($id) => (int) $id)->all()
            : [];

        if (($validated['processing_mode'] ?? 'internal') === 'referred' && empty($validated['external_laboratory_id'])) {
            throw ValidationException::withMessages([
                'external_laboratory_id' => 'Debe seleccionar un laboratorio externo para estudios derivados.',
            ]);
        }

        if (($validated['referred_status'] ?? null) === 'not_performed' && blank($validated['not_performed_reason'] ?? null)) {
            throw ValidationException::withMessages([
                'not_performed_reason' => 'Debe indicar el motivo si el estudio no fue realizado.',
            ]);
        }

        $uploadedExternalReports = $request->file('external_reports', []);

        DB::transaction(function () use ($validated, $testRequest, $allowedParameterIds, $uploadedExternalReports) {
            if (($validated['status'] ?? 'draft') === 'draft') {
                $this->ensureDraftResultsExist(
                    $testRequest,
                    isset($validated['equipment_id']) ? (int) $validated['equipment_id'] : null,
                );
            }

            $submittedValuesByParameter = [];

            foreach (($validated['results'] ?? []) as $row) {
                $parameterId = (int) $row['lab_test_parameter_id'];

                if (!in_array($parameterId, $allowedParameterIds, true)) {
                    continue;
                }

                $value = array_key_exists('value', $row) ? trim((string) $row['value']) : '';
                if ($value === '') {
                    continue;
                }

                $submittedValuesByParameter[$parameterId] = $value;

                LabResult::updateOrCreate(
                    [
                        'lab_sample_id' => $testRequest->lab_sample_id,
                        'lab_test_request_id' => $testRequest->id,
                        'lab_test_parameter_id' => $parameterId,
                    ],
                    [
                        'equipment_id' => $validated['equipment_id'] ?? null,
                        'value' => $value,
                        'is_out_of_range' => (bool) ($row['is_out_of_range'] ?? false),
                        'status' => $validated['status'],
                        'entered_by' => auth()->id(),
                    ]
                );
            }

            $processingMode = $validated['processing_mode'] ?? 'internal';
            $referredStatus = $validated['referred_status'] ?? null;

            if ($processingMode === 'referred') {
                $testRequest->update([
                    'processing_mode' => 'referred',
                    'external_laboratory_id' => $validated['external_laboratory_id'] ?? null,
                    'external_reference_number' => $validated['external_reference_number'] ?? null,
                    'expected_result_at' => $validated['expected_result_at'] ?? null,
                    'processing_notes' => $validated['processing_notes'] ?? null,
                    'include_external_attachments_in_medical_history' => (bool) ($validated['include_external_attachments_in_medical_history'] ?? false),
                    'not_performed_reason' => $referredStatus === 'not_performed'
                        ? ($validated['not_performed_reason'] ?? null)
                        : null,
                    'not_performed_at' => $referredStatus === 'not_performed' ? now() : null,
                    'sent_to_external_at' => in_array($referredStatus, ['referred_sent', 'external_result_received'], true)
                        ? ($testRequest->sent_to_external_at ?? now())
                        : null,
                    'external_result_received_at' => $referredStatus === 'external_result_received'
                        ? ($testRequest->external_result_received_at ?? now())
                        : null,
                    'status' => $referredStatus ?? 'referred_sent',
                ]);

                foreach ($uploadedExternalReports as $index => $uploadedFile) {
                    $path = $uploadedFile->store('laboratory/external-results', 'public');
                    $displayName = trim((string) (($validated['external_report_titles'][$index] ?? '') ?: ''));

                    LabTestRequestAttachment::create([
                        'lab_test_request_id' => $testRequest->id,
                        'file_path' => $path,
                        'original_name' => $uploadedFile->getClientOriginalName(),
                        'display_name' => $displayName !== '' ? $displayName : null,
                        'mime_type' => $uploadedFile->getClientMimeType(),
                        'file_size' => $uploadedFile->getSize(),
                        'kind' => 'external_result',
                        'uploaded_by' => auth()->id(),
                    ]);
                }
            } else {
                if ($testRequest->external_report_path) {
                    Storage::disk('public')->delete($testRequest->external_report_path);
                }

                foreach ($testRequest->attachments as $attachment) {
                    Storage::disk('public')->delete($attachment->file_path);
                    $attachment->delete();
                }

                $testRequest->update([
                    'processing_mode' => 'internal',
                    'external_laboratory_id' => null,
                    'external_reference_number' => null,
                    'expected_result_at' => null,
                    'processing_notes' => $validated['processing_notes'] ?? null,
                    'include_external_attachments_in_medical_history' => false,
                    'not_performed_reason' => null,
                    'not_performed_at' => null,
                    'sent_to_external_at' => null,
                    'external_result_received_at' => null,
                    'external_report_path' => null,
                    'status' => 'in_process',
                    'started_at' => $testRequest->started_at ?? now(),
                ]);
            }

            $profile = $testRequest->testProfile;
            if (
                $profile
                && $profile->validation_type === 'sum_100'
                && $validated['status'] === 'validated'
                && $processingMode === 'internal'
            ) {
                $sumParameterIds = $profile->parameters
                    ->where('include_in_sum_100', true)
                    ->pluck('id')
                    ->map(fn ($id) => (int) $id)
                    ->values();

                if ($sumParameterIds->isNotEmpty()) {
                    $storedValues = LabResult::query()
                        ->where('lab_test_request_id', $testRequest->id)
                        ->whereIn('lab_test_parameter_id', $sumParameterIds)
                        ->pluck('value', 'lab_test_parameter_id');

                    $total = 0.0;

                    foreach ($sumParameterIds as $parameterId) {
                        $rawValue = array_key_exists($parameterId, $submittedValuesByParameter)
                            ? $submittedValuesByParameter[$parameterId]
                            : ($storedValues[$parameterId] ?? null);

                        if ($rawValue === null || $rawValue === '' || !is_numeric((string) $rawValue)) {
                            throw ValidationException::withMessages([
                                'results' => 'Los parámetros marcados para suma 100% deben tener valores numéricos antes de validar.',
                            ]);
                        }

                        $total += (float) $rawValue;
                    }

                    $target = (float) ($profile->validation_target ?? 100);
                    $tolerance = (float) ($profile->validation_tolerance ?? 0);

                    if (abs($total - $target) > $tolerance) {
                        throw ValidationException::withMessages([
                            'results' => "La suma de parámetros porcentuales debe ser {$target}% (±{$tolerance}). Total actual: " . number_format($total, 2) . '%.',
                        ]);
                    }
                }
            }

            // Internal studies stay in in_process while results are being drafted.
        });

        return redirect()
            ->route('medical.laboratory.results.index')
            ->with('success', 'Resultados cargados exitosamente.');
    }

    private function ensureDraftResultsExist(LabTestRequest $testRequest, ?int $equipmentId = null): void
    {
        $parameterIds = $testRequest->testProfile?->parameters
            ?->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all() ?? [];

        foreach ($parameterIds as $parameterId) {
            LabResult::firstOrCreate(
                [
                    'lab_sample_id' => $testRequest->lab_sample_id,
                    'lab_test_request_id' => $testRequest->id,
                    'lab_test_parameter_id' => $parameterId,
                ],
                [
                    'equipment_id' => $equipmentId,
                    'value' => null,
                    'is_out_of_range' => false,
                    'status' => 'draft',
                    'entered_by' => auth()->id(),
                ]
            );
        }
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'lab_sample_id' => 'required|exists:lab_samples,id',
            'lab_test_request_id' => 'required|exists:lab_test_requests,id',
            'lab_test_parameter_id' => 'required|exists:lab_test_parameters,id',
            'equipment_id' => 'nullable|exists:lab_equipments,id',
            'value' => 'required|string|max:255',
            'calculated_percentage' => 'nullable|numeric',
            'is_out_of_range' => 'nullable|boolean',
            'status' => ['required', Rule::in(['draft', 'validated'])],
        ]);

        $testRequest = LabTestRequest::query()
            ->with('testProfile.profileEquipments')
            ->findOrFail((int) $validated['lab_test_request_id']);

        $this->validateEquipmentForTestRequest(
            $testRequest,
            isset($validated['equipment_id']) ? (int) $validated['equipment_id'] : null,
        );

        $validated['entered_by'] = auth()->id();

        LabResult::create($validated);

        return redirect()
            ->route('medical.laboratory.results.index')
            ->with('success', 'Resultado registrado exitosamente.');
    }

    public function show(LabResult $result): Response
    {
        $result->load([
            'sample.patient',
            'testRequest.testProfile',
            'parameter',
            'equipment',
            'enteredBy',
        ]);

        return Inertia::render('laboratory/results/Show', [
            'result' => $result,
        ]);
    }

    public function edit(LabResult $result): Response
    {
        $equipments = LabEquipment::where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('laboratory/results/Edit', [
            'result' => $result,
            'equipments' => $equipments,
        ]);
    }

    public function update(Request $request, LabResult $result): RedirectResponse
    {
        $validated = $request->validate([
            'lab_test_parameter_id' => 'required|exists:lab_test_parameters,id',
            'equipment_id' => 'nullable|exists:lab_equipments,id',
            'value' => 'required|string|max:255',
            'calculated_percentage' => 'nullable|numeric',
            'is_out_of_range' => 'nullable|boolean',
            'status' => ['required', Rule::in(['draft', 'validated'])],
        ]);

        $testRequest = $result->testRequest()
            ->with('testProfile.profileEquipments')
            ->first();

        if ($testRequest) {
            $this->validateEquipmentForTestRequest(
                $testRequest,
                isset($validated['equipment_id']) ? (int) $validated['equipment_id'] : null,
            );
        }

        $result->update($validated);

        return redirect()
            ->route('medical.laboratory.results.index')
            ->with('success', 'Resultado actualizado exitosamente.');
    }

    public function destroy(LabResult $result): RedirectResponse
    {
        if ($result->status === 'validated') {
            return redirect()
                ->back()
                ->with('error', 'No se pueden eliminar resultados validados.');
        }

        $result->delete();

        return redirect()
            ->route('medical.laboratory.results.index')
            ->with('success', 'Resultado eliminado exitosamente.');
    }

    private function validateEquipmentForTestRequest(LabTestRequest $testRequest, ?int $equipmentId): void
    {
        $profile = $testRequest->testProfile;

        if (! $profile) {
            return;
        }

        $linkedEquipmentIds = $profile->profileEquipments
            ->pluck('lab_equipment_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($linkedEquipmentIds->isEmpty() || $equipmentId === null || $equipmentId === 0) {
            return;
        }

        if (! $linkedEquipmentIds->contains($equipmentId)) {
            throw ValidationException::withMessages([
                'equipment_id' => 'El equipo seleccionado no esta vinculado al perfil de este estudio.',
            ]);
        }
    }
}
