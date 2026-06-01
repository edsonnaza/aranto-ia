<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabTestRequest;
use App\Models\Laboratory\LabSample;
use App\Models\Laboratory\LabTestProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Validation\Rule;

class LabTestRequestController extends Controller
{
    /**
     * Display a listing of test requests.
     */
    public function index(Request $request): Response
    {
        $query = LabTestRequest::query();

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->priority) {
            $query->where('priority', $request->priority);
        }

        if ($request->assigned_to) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->search) {
            $query->whereHas('sample', function ($q) use ($request) {
                $q->where('sample_number', 'like', "%{$request->search}%");
            });
        }

        $testRequests = $query
            ->with(['sample.patient', 'testProfile', 'requestedBy', 'assignedTo'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $technicians = User::role(['lab_technician', 'lab_supervisor'])
            ->select('id', 'name')
            ->get();

        return Inertia::render('laboratory/test-requests/Index', [
            'testRequests' => $testRequests,
            'technicians' => $technicians,
            'filters' => $request->only(['search', 'status', 'priority', 'assigned_to']),
        ]);
    }

    /**
     * Show the form for creating a new test request.
     */
    public function create(Request $request): Response
    {
        $samples = LabSample::with('patient', 'sampleType')
            ->whereDoesntHave('testRequests')
            ->orWhereHas('testRequests', function ($q) {
                $q->where('status', 'completed');
            })
            ->latest()
            ->get();

        $testProfiles = LabTestProfile::where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('laboratory/test-requests/Create', [
            'samples' => $samples,
            'testProfiles' => $testProfiles,
            'sampleId' => $request->sample_id,
        ]);
    }

    /**
     * Store a newly created test request.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'lab_sample_id' => 'required|exists:lab_samples,id',
            'lab_test_profile_id' => 'required|exists:lab_test_profiles,id',
            'priority' => ['required', Rule::in(['routine', 'urgent', 'stat'])],
            'notes' => 'nullable|string',
        ]);

        $validated['requested_by'] = auth()->id();
        $validated['status'] = 'pending';

        LabTestRequest::create($validated);

        return redirect()
            ->route('laboratory.test-requests.index')
            ->with('success', 'Solicitud de prueba creada exitosamente.');
    }

    /**
     * Display the specified test request.
     */
    public function show(LabTestRequest $testRequest): Response
    {
        $testRequest->load([
            'sample.patient',
            'sample.sampleType',
            'testProfile',
            'requestedBy',
            'assignedTo',
            'results',
            'validations',
            'worksheetItems.worksheet',
        ]);

        return Inertia::render('laboratory/test-requests/Show', [
            'testRequest' => $testRequest,
        ]);
    }

    /**
     * Assign a technician to the test request.
     */
    public function assign(Request $request, LabTestRequest $testRequest): RedirectResponse
    {
        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $testRequest->update([
            'assigned_to' => $validated['assigned_to'],
            'status' => 'assigned',
        ]);

        return redirect()
            ->back()
            ->with('success', 'Técnico asignado exitosamente.');
    }

    /**
     * Start processing the test request.
     */
    public function start(LabTestRequest $testRequest): RedirectResponse
    {
        if ($testRequest->status !== 'assigned' && $testRequest->status !== 'pending') {
            return redirect()
                ->back()
                ->with('error', 'Solo se pueden iniciar solicitudes asignadas o pendientes.');
        }

        $testRequest->update([
            'status' => 'in_process',
            'started_at' => now(),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Procesamiento iniciado.');
    }

    /**
     * Complete the test request.
     */
    public function complete(LabTestRequest $testRequest): RedirectResponse
    {
        if ($testRequest->status !== 'in_process') {
            return redirect()
                ->back()
                ->with('error', 'Solo se pueden completar solicitudes en proceso.');
        }

        // Verify that results exist
        if ($testRequest->results()->count() === 0) {
            return redirect()
                ->back()
                ->with('error', 'Debe ingresar al menos un resultado antes de completar.');
        }

        $testRequest->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Solicitud completada.');
    }

    /**
     * Cancel the test request.
     */
    public function cancel(Request $request, LabTestRequest $testRequest): RedirectResponse
    {
        $validated = $request->validate([
            'notes' => 'required|string',
        ]);

        $testRequest->update([
            'status' => 'cancelled',
            'notes' => $validated['notes'],
        ]);

        return redirect()
            ->back()
            ->with('success', 'Solicitud cancelada.');
    }

    /**
     * Remove the specified test request.
     */
    public function destroy(LabTestRequest $testRequest): RedirectResponse
    {
        if ($testRequest->status !== 'pending') {
            return redirect()
                ->back()
                ->with('error', 'Solo se pueden eliminar solicitudes pendientes.');
        }

        $testRequest->delete();

        return redirect()
            ->route('laboratory.test-requests.index')
            ->with('success', 'Solicitud eliminada exitosamente.');
    }
}
