<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabArea;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LabAreaController extends Controller
{
    public function index(Request $request): Response
    {
        $query = LabArea::query()->withCount(['profiles', 'equipments']);

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $areas = $query
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('laboratory/areas/Index', [
            'areas' => $areas,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('laboratory/areas/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateArea($request);

        LabArea::create($validated);

        return redirect()
            ->route('medical.laboratory.areas.index')
            ->with('success', 'Área creada exitosamente.');
    }

    public function edit(LabArea $area): Response
    {
        return Inertia::render('laboratory/areas/Edit', [
            'area' => $area,
        ]);
    }

    public function update(Request $request, LabArea $area): RedirectResponse
    {
        $validated = $this->validateArea($request, $area);

        $area->update($validated);

        return redirect()
            ->route('medical.laboratory.areas.index')
            ->with('success', 'Área actualizada exitosamente.');
    }

    public function destroy(LabArea $area): RedirectResponse
    {
        if ($area->profiles()->exists() || $area->equipments()->exists()) {
            return redirect()
                ->route('medical.laboratory.areas.index')
                ->with('error', 'No se puede eliminar el área porque tiene perfiles o equipos vinculados.');
        }

        $area->delete();

        return redirect()
            ->route('medical.laboratory.areas.index')
            ->with('success', 'Área eliminada exitosamente.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateArea(Request $request, ?LabArea $area = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => [
                'required',
                'string',
                'max:30',
                Rule::unique('lab_areas', 'code')->ignore($area?->id),
            ],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'display_order' => ['nullable', 'integer', 'min:0', 'max:999'],
        ]);
    }
}
