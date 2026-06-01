<?php
namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabSample;
use App\Models\Laboratory\LabSampleType;
use App\Models\Patient;
use App\Models\ServiceRequestDetail;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
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
        $patients = Patient::where('status', 'active')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        return Inertia::render('laboratory/samples/Index', [
            'samples' => $samples,
            'sampleTypes' => $sampleTypes,
            'patients' => $patients,
            'filters' => $request->only(['search', 'status', 'sample_type_id']),
        ]);
    }

    public function create(Request $request): Response
    {
        $sampleTypes = LabSampleType::active()->orderBy('name')->get();
        $patients = Patient::where('status', 'active')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
        $serviceRequestDetails = ServiceRequestDetail::with('serviceRequest')
            ->whereHas('serviceRequest', function ($q) {
                $q->where('status', 'approved');
            })
            ->get();

        return Inertia::render('laboratory/samples/Create', [
            'sampleTypes' => $sampleTypes,
            'patients' => $patients,
            'serviceRequestDetails' => $serviceRequestDetails,
            'serviceRequestDetailId' => $request->service_request_detail_id,
        ]);
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
