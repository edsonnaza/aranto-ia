<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\ExternalLaboratory;
use App\Models\Laboratory\LabResult;
use App\Models\Laboratory\LabTestRequest;
use App\Models\Laboratory\LabTestRequestAttachment;
use App\Models\Laboratory\LabSample;
use App\Models\Laboratory\LabTestProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
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
            $query->where('assigned_to_user_id', $request->assigned_to);
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
            'assigned_to_user_id' => $validated['assigned_to'],
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

    public function asset(LabTestRequest $testRequest): StreamedResponse
    {
        $path = $testRequest->external_report_path;

        abort_unless($path && Storage::disk('public')->exists($path), 404);

        return Storage::disk('public')->response($path);
    }

    public function attachmentAsset(LabTestRequest $testRequest, LabTestRequestAttachment $attachment): StreamedResponse
    {
        abort_unless($attachment->lab_test_request_id === $testRequest->id, 404);
        abort_unless(Storage::disk('public')->exists($attachment->file_path), 404);

        return Storage::disk('public')->response($attachment->file_path);
    }

    public function destroyAttachment(LabTestRequest $testRequest, LabTestRequestAttachment $attachment): RedirectResponse
    {
        abort_unless($attachment->lab_test_request_id === $testRequest->id, 404);

        if (Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        $attachment->delete();

        return redirect()
            ->back()
            ->with('success', 'Adjunto eliminado correctamente.');
    }

    public function updateProcessing(Request $request, LabTestRequest $testRequest): RedirectResponse
    {
        $validated = $request->validate([
            'processing_mode' => ['required', Rule::in(['internal', 'referred'])],
            'status' => ['required', Rule::in(['pending', 'in_process', 'referred_sent', 'external_result_received', 'not_performed'])],
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
        ]);

        if ($validated['processing_mode'] === 'referred' && empty($validated['external_laboratory_id'])) {
            return redirect()
                ->back()
                ->withErrors(['external_laboratory_id' => 'Debe seleccionar un laboratorio externo.']);
        }

        if (($validated['status'] ?? null) === 'not_performed' && blank($validated['not_performed_reason'] ?? null)) {
            return redirect()
                ->back()
                ->withErrors(['not_performed_reason' => 'Debe indicar el motivo si el estudio no fue realizado.']);
        }

        $testRequest->loadMissing('attachments');
        $uploadedExternalReports = $request->file('external_reports', []);

        if ($validated['processing_mode'] === 'referred') {
            $this->ensureDraftResultsExist($testRequest);

            $testRequest->update([
                'processing_mode' => 'referred',
                'status' => $validated['status'],
                'external_laboratory_id' => $validated['external_laboratory_id'] ?? null,
                'external_reference_number' => $validated['external_reference_number'] ?? null,
                'expected_result_at' => $validated['expected_result_at'] ?? null,
                'processing_notes' => $validated['processing_notes'] ?? null,
                'include_external_attachments_in_medical_history' => (bool) ($validated['include_external_attachments_in_medical_history'] ?? false),
                'not_performed_reason' => $validated['status'] === 'not_performed'
                    ? ($validated['not_performed_reason'] ?? null)
                    : null,
                'not_performed_at' => $validated['status'] === 'not_performed' ? now() : null,
                'sent_to_external_at' => in_array($validated['status'], ['referred_sent', 'external_result_received'], true)
                    ? ($testRequest->sent_to_external_at ?? now())
                    : null,
                'external_result_received_at' => $validated['status'] === 'external_result_received'
                    ? ($testRequest->external_result_received_at ?? now())
                    : null,
                'started_at' => $testRequest->started_at ?? now(),
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
                'status' => in_array($testRequest->status, ['pending', 'assigned'], true) ? 'pending' : 'in_process',
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
                'started_at' => $testRequest->started_at ?? now(),
            ]);
        }

        return redirect()
            ->back()
            ->with('success', 'Estado de derivación actualizado exitosamente.');
    }

    private function ensureDraftResultsExist(LabTestRequest $testRequest): void
    {
        $testRequest->loadMissing('testProfile.parameters');

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
                    'equipment_id' => null,
                    'value' => null,
                    'is_out_of_range' => false,
                    'status' => 'draft',
                    'entered_by' => auth()->id(),
                ]
            );
        }
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
