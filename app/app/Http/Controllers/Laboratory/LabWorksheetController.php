<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabWorksheet;
use App\Models\Laboratory\LabTestRequest;
use App\Models\Laboratory\LabEquipment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class LabWorksheetController extends Controller
{
    /**
     * Display a listing of worksheets.
     */
    public function index(Request $request): Response
    {
        $query = LabWorksheet::query();

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->equipment_id) {
            $query->where('lab_equipment_id', $request->equipment_id);
        }

        if ($request->technician_id) {
            $query->where('technician_id', $request->technician_id);
        }

        if ($request->date) {
            $query->whereDate('worksheet_date', $request->date);
        }

        if ($request->search) {
            $query->where('worksheet_number', 'like', "%{$request->search}%");
        }

        $worksheets = $query
            ->with(['equipment', 'technician', 'items'])
            ->latest('worksheet_date')
            ->paginate(20)
            ->withQueryString();

        // Add items count to each worksheet
        $worksheets->getCollection()->transform(function ($worksheet) {
            $worksheet->items_count = $worksheet->items->count();
            return $worksheet;
        });

        $equipments = LabEquipment::where('status', 'active')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $technicians = User::role(['lab_technician', 'lab_supervisor'])
            ->select('id', 'name')
            ->get();

        return Inertia::render('laboratory/worksheets/Index', [
            'worksheets' => $worksheets,
            'equipments' => $equipments,
            'technicians' => $technicians,
            'filters' => $request->only(['search', 'status', 'equipment_id', 'technician_id', 'date']),
        ]);
    }

    /**
     * Show the form for creating a new worksheet.
     */
    public function create(): Response
    {
        $equipments = LabEquipment::where('status', 'active')
            ->orderBy('name')
            ->get();

        $technicians = User::role(['lab_technician', 'lab_supervisor'])
            ->get();

        // Get pending test requests
        $pendingRequests = LabTestRequest::whereIn('status', ['pending', 'assigned'])
            ->with(['sample.patient', 'sample.sampleType', 'testProfile'])
            ->latest()
            ->get();

        // Generate next worksheet number
        $today = Carbon::today();
        $count = LabWorksheet::whereDate('worksheet_date', $today)->count() + 1;
        $worksheetNumber = 'WS-' . $today->format('Ymd') . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);

        return Inertia::render('laboratory/worksheets/Create', [
            'equipments' => $equipments,
            'technicians' => $technicians,
            'pendingRequests' => $pendingRequests,
            'suggestedWorksheetNumber' => $worksheetNumber,
        ]);
    }

    /**
     * Store a newly created worksheet.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'worksheet_number' => 'required|string|max:50|unique:lab_worksheets,worksheet_number',
            'worksheet_date' => 'required|date',
            'lab_equipment_id' => 'nullable|exists:lab_equipments,id',
            'technician_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
            'test_request_ids' => 'required|array|min:1',
            'test_request_ids.*' => 'exists:lab_test_requests,id',
        ]);

        $validated['status'] = 'draft';

        $worksheet = LabWorksheet::create($validated);

        // Attach test requests as worksheet items
        foreach ($validated['test_request_ids'] as $index => $testRequestId) {
            $worksheet->items()->create([
                'lab_test_request_id' => $testRequestId,
                'position' => $index + 1,
                'status' => 'pending',
            ]);
        }

        return redirect()
            ->route('laboratory.worksheets.show', $worksheet)
            ->with('success', 'Hoja de trabajo creada exitosamente.');
    }

    /**
     * Display the specified worksheet.
     */
    public function show(LabWorksheet $worksheet): Response
    {
        $worksheet->load([
            'equipment',
            'technician',
            'items.testRequest.sample.patient',
            'items.testRequest.sample.sampleType',
            'items.testRequest.testProfile',
        ]);

        return Inertia::render('laboratory/worksheets/Show', [
            'worksheet' => $worksheet,
        ]);
    }

    /**
     * Show the form for editing the specified worksheet.
     */
    public function edit(LabWorksheet $worksheet): Response|RedirectResponse
    {
        if ($worksheet->status !== 'draft') {
            return redirect()
                ->route('laboratory.worksheets.show', $worksheet)
                ->with('error', 'Solo se pueden editar hojas de trabajo en borrador.');
        }

        $worksheet->load(['items.testRequest']);

        $equipments = LabEquipment::where('status', 'active')
            ->orderBy('name')
            ->get();

        $technicians = User::role(['lab_technician', 'lab_supervisor'])
            ->get();

        $pendingRequests = LabTestRequest::whereIn('status', ['pending', 'assigned'])
            ->with(['sample.patient', 'sample.sampleType', 'testProfile'])
            ->latest()
            ->get();

        return Inertia::render('laboratory/worksheets/Edit', [
            'worksheet' => $worksheet,
            'equipments' => $equipments,
            'technicians' => $technicians,
            'pendingRequests' => $pendingRequests,
        ]);
    }

    /**
     * Update the specified worksheet.
     */
    public function update(Request $request, LabWorksheet $worksheet): RedirectResponse
    {
        if ($worksheet->status !== 'draft') {
            return redirect()
                ->back()
                ->with('error', 'Solo se pueden editar hojas de trabajo en borrador.');
        }

        $validated = $request->validate([
            'worksheet_number' => ['required', 'string', 'max:50', Rule::unique('lab_worksheets')->ignore($worksheet->id)],
            'worksheet_date' => 'required|date',
            'lab_equipment_id' => 'nullable|exists:lab_equipments,id',
            'technician_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
            'test_request_ids' => 'required|array|min:1',
            'test_request_ids.*' => 'exists:lab_test_requests,id',
        ]);

        $worksheet->update($validated);

        // Sync worksheet items
        $worksheet->items()->delete();
        foreach ($validated['test_request_ids'] as $index => $testRequestId) {
            $worksheet->items()->create([
                'lab_test_request_id' => $testRequestId,
                'position' => $index + 1,
                'status' => 'pending',
            ]);
        }

        return redirect()
            ->route('laboratory.worksheets.show', $worksheet)
            ->with('success', 'Hoja de trabajo actualizada exitosamente.');
    }

    /**
     * Start processing the worksheet.
     */
    public function start(LabWorksheet $worksheet): RedirectResponse
    {
        if ($worksheet->status !== 'draft') {
            return redirect()
                ->back()
                ->with('error', 'Solo se pueden iniciar hojas de trabajo en borrador.');
        }

        $worksheet->update(['status' => 'in_progress']);

        // Update all test requests to in_process
        foreach ($worksheet->items as $item) {
            $item->testRequest->update([
                'status' => 'in_process',
                'started_at' => now(),
            ]);
            $item->update(['status' => 'processing']);
        }

        return redirect()
            ->back()
            ->with('success', 'Hoja de trabajo iniciada.');
    }

    /**
     * Complete the worksheet.
     */
    public function complete(LabWorksheet $worksheet): RedirectResponse
    {
        if ($worksheet->status !== 'in_progress') {
            return redirect()
                ->back()
                ->with('error', 'Solo se pueden completar hojas de trabajo en progreso.');
        }

        // Check if all items are completed
        $pendingItems = $worksheet->items()->where('status', '!=', 'completed')->count();
        if ($pendingItems > 0) {
            return redirect()
                ->back()
                ->with('error', "Hay {$pendingItems} item(s) pendientes de completar.");
        }

        $worksheet->update(['status' => 'completed']);

        return redirect()
            ->back()
            ->with('success', 'Hoja de trabajo completada.');
    }

    /**
     * Cancel the worksheet.
     */
    public function cancel(Request $request, LabWorksheet $worksheet): RedirectResponse
    {
        if (!in_array($worksheet->status, ['draft', 'in_progress'])) {
            return redirect()
                ->back()
                ->with('error', 'No se puede cancelar esta hoja de trabajo.');
        }

        $validated = $request->validate([
            'notes' => 'required|string',
        ]);

        $worksheet->update([
            'status' => 'cancelled',
            'notes' => $validated['notes'],
        ]);

        return redirect()
            ->back()
            ->with('success', 'Hoja de trabajo cancelada.');
    }

    /**
     * Remove the specified worksheet.
     */
    public function destroy(LabWorksheet $worksheet): RedirectResponse
    {
        if ($worksheet->status !== 'draft') {
            return redirect()
                ->back()
                ->with('error', 'Solo se pueden eliminar hojas de trabajo en borrador.');
        }

        $worksheet->delete();

        return redirect()
            ->route('laboratory.worksheets.index')
            ->with('success', 'Hoja de trabajo eliminada exitosamente.');
    }
}
