<?php
namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabResult;
use App\Models\Laboratory\LabValidation;
use App\Models\Laboratory\LabTestRequest;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class LabValidationController extends Controller
{
    public function index(Request $request): Response
    {
        $query = LabValidation::query();

        if ($request->search) {
            $query->whereHas('sample', function ($q) use ($request) {
                $q->where('sample_number', 'like', "%{$request->search}%");
            });
        }

        if ($request->validated_by) {
            $query->where('validated_by', $request->validated_by);
        }

        $validations = $query
            ->with(['sample.patient', 'testRequest.testProfile', 'validatedBy'])
            ->latest('validated_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('laboratory/validations/Index', [
            'validations' => $validations,
            'filters' => $request->only(['search', 'validated_by']),
        ]);
    }

    public function create(Request $request): Response
    {
        // Get test requests that are completed but not validated
        $testRequests = LabTestRequest::where('status', 'completed')
            ->whereDoesntHave('validations')
            ->with(['sample.patient', 'testProfile', 'results'])
            ->get();

        return Inertia::render('laboratory/validations/Create', [
            'testRequests' => $testRequests,
            'testRequestId' => $request->test_request_id,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'lab_sample_id' => 'required|exists:lab_samples,id',
            'lab_test_request_id' => 'required|exists:lab_test_requests,id',
            'comments' => 'nullable|string',
        ]);

        $validated['validated_by'] = auth()->id();
        $validated['validated_at'] = now();

        LabValidation::create($validated);

        // Mark results for this request as validated and close the request.
        LabResult::query()
            ->where('lab_test_request_id', $validated['lab_test_request_id'])
            ->update(['status' => 'validated']);

        $testRequest = LabTestRequest::query()->find($validated['lab_test_request_id']);
        $testRequest?->update(['status' => 'completed']);
        $testRequest?->sample?->update(['status' => 'validated']);

        return redirect()
            ->route('medical.laboratory.results.index')
            ->with('success', 'Resultados validados con éxito.');
    }

    public function show(LabValidation $validation): Response
    {
        $validation->load([
            'sample.patient',
            'sample.sampleType',
            'testRequest.testProfile',
            'testRequest.results.parameter',
            'validatedBy',
        ]);

        return Inertia::render('laboratory/validations/Show', [
            'validation' => $validation,
        ]);
    }

    public function edit(LabValidation $validation): Response
    {
        $validation->load(['sample', 'testRequest']);

        return Inertia::render('laboratory/validations/Edit', [
            'validation' => $validation,
        ]);
    }

    public function update(Request $request, LabValidation $validation): RedirectResponse
    {
        $validated = $request->validate([
            'comments' => 'nullable|string',
        ]);

        $validation->update($validated);

        return redirect()
            ->route('medical.laboratory.validations.index')
            ->with('success', 'Validación actualizada exitosamente.');
    }

    public function destroy(LabValidation $validation): RedirectResponse
    {
        // Revert validation state back to pending validation.
        $validation->testRequest->update(['status' => 'in_process']);
        $validation->sample?->update(['status' => 'pending_validation']);
        LabResult::query()
            ->where('lab_test_request_id', $validation->lab_test_request_id)
            ->update(['status' => 'draft']);

        $validation->delete();

        return redirect()
            ->route('medical.laboratory.validations.index')
            ->with('success', 'Validación eliminada exitosamente.');
    }
}

