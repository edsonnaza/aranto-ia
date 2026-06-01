<?php
namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabResult;
use App\Models\Laboratory\LabTestRequest;
use App\Models\Laboratory\LabTestParameter;
use App\Models\Laboratory\LabEquipment;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LabResultController extends Controller
{
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

        return Inertia::render('laboratory/results/Index', [
            'results' => $results,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(Request $request): Response
    {
        $testRequests = LabTestRequest::where('status', 'in_process')
            ->with(['sample.patient', 'testProfile'])
            ->get();

        $parameters = LabTestParameter::where('status', 'active')
            ->orderBy('name')
            ->get();

        $equipments = LabEquipment::where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('laboratory/results/Create', [
            'testRequests' => $testRequests,
            'parameters' => $parameters,
            'equipments' => $equipments,
            'testRequestId' => $request->test_request_id,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'lab_sample_id' => 'required|exists:lab_samples,id',
            'lab_test_request_id' => 'required|exists:lab_test_requests,id',
            'lab_test_parameter_id' => 'required|exists:lab_test_parameters,id',
            'equipment_id' => 'nullable|exists:lab_equipments,id',
            'value' => 'required|string',
            'calculated_percentage' => 'nullable|numeric',
            'is_out_of_range' => 'nullable|boolean',
            'status' => ['required', Rule::in(['pending', 'validated', 'rejected'])],
        ]);

        $validated['entered_by'] = auth()->id();

        LabResult::create($validated);

        return redirect()
            ->route('laboratory.results.index')
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
        $parameters = LabTestParameter::where('status', 'active')
            ->orderBy('name')
            ->get();

        $equipments = LabEquipment::where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('laboratory/results/Edit', [
            'result' => $result,
            'parameters' => $parameters,
            'equipments' => $equipments,
        ]);
    }

    public function update(Request $request, LabResult $result): RedirectResponse
    {
        $validated = $request->validate([
            'lab_test_parameter_id' => 'required|exists:lab_test_parameters,id',
            'equipment_id' => 'nullable|exists:lab_equipments,id',
            'value' => 'required|string',
            'calculated_percentage' => 'nullable|numeric',
            'is_out_of_range' => 'nullable|boolean',
            'status' => ['required', Rule::in(['pending', 'validated', 'rejected'])],
        ]);

        $result->update($validated);

        return redirect()
            ->route('laboratory.results.index')
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
            ->route('laboratory.results.index')
            ->with('success', 'Resultado eliminado exitosamente.');
    }
}
