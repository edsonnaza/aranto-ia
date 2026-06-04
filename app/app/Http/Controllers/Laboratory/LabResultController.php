<?php
namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabEquipment;
use App\Models\Laboratory\LabResult;
use App\Models\Laboratory\LabSample;
use App\Models\Laboratory\LabTestRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LabResultController extends Controller
{
    public function create(Request $request): Response
    {
        $testRequests = LabTestRequest::query()
            ->whereIn('status', ['pending', 'assigned', 'in_process', 'completed'])
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
            'initialTestRequestId' => $initialTestRequestId,
            'existingResults' => $existingResults,
        ]);
    }

    public function index(Request $request): Response
    {
        $query = LabResult::query();

        if ($request->search) {
            $query->whereHas('sample', function ($q) use ($request) {
                $q->where('sample_number', 'like', "%{$request->search}%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $results = $query
            ->with(['sample.patient', 'testRequest.testProfile', 'parameter', 'equipment', 'enteredBy'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

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
            'results' => $results,
            'filters' => $request->only(['search', 'status']),
            'canValidate' => auth()->user()?->hasPermissionTo('validate-lab-results') ?? false,
        ]);
    }

    public function storeBatch(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'lab_test_request_id' => 'required|exists:lab_test_requests,id',
            'equipment_id' => 'nullable|exists:lab_equipments,id',
            'status' => ['required', Rule::in(['draft', 'validated'])],
            'results' => ['required', 'array', 'min:1'],
            'results.*.lab_test_parameter_id' => ['required', 'exists:lab_test_parameters,id'],
            'results.*.value' => ['nullable', 'string', 'max:255'],
            'results.*.is_out_of_range' => ['nullable', 'boolean'],
        ]);

        $testRequest = LabTestRequest::query()
            ->with('testProfile.parameters')
            ->findOrFail((int) $validated['lab_test_request_id']);

        $allowedParameterIds = $testRequest->testProfile
            ? $testRequest->testProfile->parameters->pluck('id')->map(fn ($id) => (int) $id)->all()
            : [];

        DB::transaction(function () use ($validated, $testRequest, $allowedParameterIds) {
            $submittedValuesByParameter = [];

            foreach ($validated['results'] as $row) {
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

            $profile = $testRequest->testProfile;
            if (
                $profile
                && $profile->validation_type === 'sum_100'
                && $validated['status'] === 'validated'
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

            if ($testRequest->status === 'pending' || $testRequest->status === 'assigned') {
                $testRequest->update([
                    'status' => 'in_process',
                    'started_at' => $testRequest->started_at ?? now(),
                ]);
            }
        });

        return redirect()
            ->route('medical.laboratory.results.index')
            ->with('success', 'Resultados cargados exitosamente.');
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
}
