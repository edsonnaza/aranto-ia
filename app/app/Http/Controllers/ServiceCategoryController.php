<?php

namespace App\Http\Controllers;

use App\Models\ServiceCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;

class ServiceCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = ServiceCategory::query();

        // Filtros
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $categories = $query
            ->withCount(['medicalServices as active_services_count' => function ($query) {
                $query->where('status', 'active');
            }])
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('medical/ServiceCategories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search', 'status']),
            'stats' => [
                'total' => ServiceCategory::count(),
                'active' => ServiceCategory::where('status', 'active')->count(),
                'total_services' => ServiceCategory::withCount('medicalServices')->get()->sum('medical_services_count'),
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('medical/ServiceCategories/Create', [
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
            'name' => ['required', 'string', 'max:100', 'unique:service_categories'],
            'description' => ['nullable', 'string', 'max:500'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        ServiceCategory::create($validated);

        return redirect()
            ->route('medical.service-categories.index')
            ->with('message', 'Categoría de servicio creada exitosamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(ServiceCategory $serviceCategory): Response
    {
        $serviceCategory->loadCount([
            'medicalServices as total_services_count',
            'medicalServices as active_services_count' => function ($query) {
                $query->where('status', 'active');
            }
        ]);

        // Obtener servicios de esta categoría
        $services = $serviceCategory->medicalServices()
            ->withCount('servicePrices')
            ->orderBy('name')
            ->paginate(10);

        return Inertia::render('medical/ServiceCategories/Show', [
            'category' => $serviceCategory,
            'services' => $services,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ServiceCategory $serviceCategory): Response
    {
        return Inertia::render('medical/ServiceCategories/Edit', [
            'category' => $serviceCategory,
            'statusOptions' => [
                ['value' => 'active', 'label' => 'Activo'],
                ['value' => 'inactive', 'label' => 'Inactivo'],
            ]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ServiceCategory $serviceCategory): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('service_categories')->ignore($serviceCategory)],
            'description' => ['nullable', 'string', 'max:500'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $serviceCategory->update($validated);

        return redirect()
            ->route('medical.service-categories.index')
            ->with('message', 'Categoría de servicio actualizada exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ServiceCategory $serviceCategory): RedirectResponse
    {
        // Verificar si tiene servicios médicos asociados
        if ($serviceCategory->medicalServices()->exists()) {
            return redirect()
                ->route('medical.service-categories.index')
                ->with('error', 'No se puede eliminar la categoría porque tiene servicios médicos asociados.');
        }

        $serviceCategory->delete();

        return redirect()
            ->route('medical.service-categories.index')
            ->with('message', 'Categoría de servicio eliminada exitosamente.');
    }
}
