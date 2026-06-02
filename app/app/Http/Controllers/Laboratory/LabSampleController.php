<?php
namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\InsuranceType;
use App\Models\MedicalService;
use App\Models\Laboratory\LabSample;
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
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LabSampleController extends Controller
{
    public function index(Request $request): Response
    {
        $query = LabSample::query();

        if ($request->search) {
            $query->where('sample_number', 'like', "%{$request->search}%")
                  ->orWhere('barcode', 'like', "%{$request->search}%");
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->sample_type_id) {
            $query->where('lab_sample_type_id', $request->sample_type_id);
        }

        $samples = $query
            ->with(['serviceRequestDetail', 'patient', 'sampleType', 'receivedBy'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $sampleTypes = LabSampleType::active()->orderBy('name')->get();

        return Inertia::render('laboratory/samples/Index', [
            'samples' => $samples,
            'sampleTypes' => $sampleTypes,
            'filters' => $request->only(['search', 'status', 'sample_type_id']),
        ]);
    }

    public function create(Request $request): Response
    {
        $professionals = Professional::where('status', 'active')
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

        $insuranceTypes = InsuranceType::where('status', 'active')
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

        $labServiceIds = LabTestProfile::query()
            ->where('status', 'active')
            ->whereNotNull('medical_service_id')
            ->pluck('medical_service_id')
            ->unique()
            ->values();

        $medicalServices = ServiceCategory::query()
            ->where('status', 'active')
            ->with(['medicalServices' => function ($query) use ($labServiceIds) {
                $query->where('status', 'active')
                    ->whereIn('medical_services.id', $labServiceIds)
                    ->orderBy('name');
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

        return Inertia::render('laboratory/create/Create', [
            'patients' => [],
            'medicalServices' => $medicalServices,
            'professionals' => $professionals,
            'insuranceTypes' => $insuranceTypes,
        ]);
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
            'samples.*.professional_id'     => 'nullable|exists:users,id',
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
                        'assigned_to'         => !empty($sampleData['professional_id']) ? $sampleData['professional_id'] : null,
                        'priority'            => $request->priority,
                        'status'              => !empty($sampleData['professional_id']) ? 'assigned' : 'pending',
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
            'status' => ['required', Rule::in(['received', 'processing', 'completed', 'rejected'])],
            'remarks' => 'nullable|string',
        ]);

        $sample->update($validated);

        return redirect()
            ->route('laboratory.samples.index')
            ->with('success', 'Muestra actualizada exitosamente.');
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
