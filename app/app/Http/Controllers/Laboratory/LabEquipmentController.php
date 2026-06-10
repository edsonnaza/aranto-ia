<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabArea;
use App\Models\Laboratory\LabEquipment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LabEquipmentController extends Controller
{
    public function index(Request $request): Response
    {
        $query = LabEquipment::query()->with('area');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('manufacturer', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('serial_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('area_id')) {
            $query->where('lab_area_id', $request->integer('area_id'));
        }

        $equipments = $query
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('laboratory/equipments/Index', [
            'equipments' => $equipments,
            'areas' => $this->areas(),
            'filters' => $request->only(['search', 'status', 'area_id']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('laboratory/equipments/Create', [
            'areas' => $this->areas(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateEquipment($request);

        LabEquipment::create($validated);

        return redirect()
            ->route('medical.laboratory.equipments.index')
            ->with('success', 'Equipo creado exitosamente.');
    }

    public function edit(LabEquipment $equipment): Response
    {
        $equipment->load('area');

        return Inertia::render('laboratory/equipments/Edit', [
            'equipment' => $equipment,
            'areas' => $this->areas(),
        ]);
    }

    public function update(Request $request, LabEquipment $equipment): RedirectResponse
    {
        $validated = $this->validateEquipment($request, $equipment);

        $equipment->update($validated);

        return redirect()
            ->route('medical.laboratory.equipments.index')
            ->with('success', 'Equipo actualizado exitosamente.');
    }

    public function destroy(LabEquipment $equipment): RedirectResponse
    {
        if ($equipment->profileEquipments()->exists() || $equipment->parameterRanges()->exists()) {
            return redirect()
                ->route('medical.laboratory.equipments.index')
                ->with('error', 'No se puede eliminar el equipo porque ya esta vinculado a perfiles o parametros.');
        }

        $equipment->delete();

        return redirect()
            ->route('medical.laboratory.equipments.index')
            ->with('success', 'Equipo eliminado exitosamente.');
    }

    /**
     * @return array<int, array{id:int, name:string, code:string}>
     */
    private function areas(): array
    {
        return LabArea::query()
            ->where('status', 'active')
            ->orderBy('display_order')
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn (LabArea $area) => [
                'id' => $area->id,
                'name' => $area->name,
                'code' => $area->code,
            ])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function validateEquipment(Request $request, ?LabEquipment $equipment = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('lab_equipments', 'code')->ignore($equipment?->id),
            ],
            'manufacturer' => ['nullable', 'string', 'max:200'],
            'model' => ['nullable', 'string', 'max:200'],
            'serial_number' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:150'],
            'lab_area_id' => ['nullable', 'exists:lab_areas,id'],
            'status' => ['required', Rule::in(['active', 'maintenance', 'inactive'])],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
