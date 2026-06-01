<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabSampleType;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Validation\Rule;

class LabSampleTypeController extends Controller
{
    /**
     * Display a listing of sample types.
     */
    public function index(Request $request): Response
    {
        $query = LabSampleType::query();

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $sampleTypes = $query
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('laboratory/sample-types/Index', [
            'sampleTypes' => $sampleTypes,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new sample type.
     */
    public function create(): Response
    {
        return Inertia::render('laboratory/sample-types/Create');
    }

    /**
     * Store a newly created sample type.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:lab_sample_types,code',
            'description' => 'nullable|string',
            'container_type' => 'required|string|max:100',
            'preservation_requirements' => 'nullable|string',
            'stability_hours' => 'nullable|integer|min:0',
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        LabSampleType::create($validated);

        return redirect()
            ->route('laboratory.sample-types.index')
            ->with('success', 'Tipo de muestra creado exitosamente.');
    }

    /**
     * Display the specified sample type.
     */
    public function show(LabSampleType $sampleType): Response
    {
        $sampleType->load(['samples' => function ($query) {
            $query->latest()->limit(10);
        }]);

        return Inertia::render('laboratory/sample-types/Show', [
            'sampleType' => $sampleType,
            'samplesCount' => $sampleType->samples()->count(),
        ]);
    }

    /**
     * Show the form for editing the specified sample type.
     */
    public function edit(LabSampleType $sampleType): Response
    {
        return Inertia::render('laboratory/sample-types/Edit', [
            'sampleType' => $sampleType,
        ]);
    }

    /**
     * Update the specified sample type.
     */
    public function update(Request $request, LabSampleType $sampleType): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => ['required', 'string', 'max:50', Rule::unique('lab_sample_types')->ignore($sampleType->id)],
            'description' => 'nullable|string',
            'container_type' => 'required|string|max:100',
            'preservation_requirements' => 'nullable|string',
            'stability_hours' => 'nullable|integer|min:0',
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $sampleType->update($validated);

        return redirect()
            ->route('laboratory.sample-types.index')
            ->with('success', 'Tipo de muestra actualizado exitosamente.');
    }

    /**
     * Remove the specified sample type.
     */
    public function destroy(LabSampleType $sampleType): RedirectResponse
    {
        // Check if there are samples using this type
        if ($sampleType->samples()->count() > 0) {
            return redirect()
                ->route('laboratory.sample-types.index')
                ->with('error', 'No se puede eliminar. Hay muestras asociadas a este tipo.');
        }

        $sampleType->delete();

        return redirect()
            ->route('laboratory.sample-types.index')
            ->with('success', 'Tipo de muestra eliminado exitosamente.');
    }
}
