<?php

namespace App\Http\Controllers;

use App\Models\Specialty;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;

class SpecialtyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Specialty::query();

        // Filters
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $specialties = $query
            ->withCount(['professionals as professionals_count'])
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('medical/Specialties/Index', [
            'specialties' => $specialties,
            'filters' => $request->only(['search', 'status']),
            'stats' => [
                'total' => Specialty::count(),
                'active' => Specialty::where('status', 'active')->count(),
                'total_professionals' => Specialty::withCount('professionals')->get()->sum('professionals_count'),
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('medical/Specialties/Create', [
            'statusOptions' => [
                ['value' => 'active', 'label' => 'Activo'],
                ['value' => 'inactive', 'label' => 'Inactivo'],
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:specialties'],
            'code' => ['nullable', 'string', 'max:20', 'unique:specialties'],
            'description' => ['nullable', 'string', 'max:500'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        Specialty::create($validated);

        return redirect()
            ->route('medical.specialties.index')
            ->with('success', 'Especialidad creada correctamente');
    }

    /**
     * Display the specified resource.
     */
    public function show(Specialty $specialty): Response
    {
        $specialty->load(['professionals' => function ($query) {
            $query->where('status', 'active');
        }]);

        return Inertia::render('medical/Specialties/Show', [
            'specialty' => $specialty,
            'professionals' => $specialty->professionals()->paginate(10),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Specialty $specialty): Response
    {
        return Inertia::render('medical/Specialties/Edit', [
            'specialty' => $specialty,
            'statusOptions' => [
                ['value' => 'active', 'label' => 'Activo'],
                ['value' => 'inactive', 'label' => 'Inactivo'],
            ]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Specialty $specialty): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('specialties')->ignore($specialty->id)],
            'code' => ['nullable', 'string', 'max:20', Rule::unique('specialties')->ignore($specialty->id)],
            'description' => ['nullable', 'string', 'max:500'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $specialty->update($validated);

        return redirect()
            ->route('medical.specialties.index')
            ->with('success', 'Especialidad actualizada correctamente');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Specialty $specialty): RedirectResponse
    {
        // Check if specialty has professionals
        if ($specialty->professionals()->count() > 0) {
            return redirect()
                ->back()
                ->with('error', 'No se puede eliminar una especialidad que tiene profesionales asignados');
        }

        $specialty->delete();

        return redirect()
            ->route('medical.specialties.index')
            ->with('success', 'Especialidad eliminada correctamente');
    }

    /**
     * Toggle specialty status.
     */
    public function toggleStatus(Specialty $specialty): RedirectResponse
    {
        $specialty->update([
            'status' => $specialty->status === 'active' ? 'inactive' : 'active'
        ]);

        return redirect()
            ->back()
            ->with('success', 'Estado de especialidad actualizado');
    }
}
