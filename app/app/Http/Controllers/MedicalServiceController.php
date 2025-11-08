<?php

namespace App\Http\Controllers;

use App\Models\MedicalService;
use App\Models\ServiceCategory;
use App\Models\InsuranceType;
use App\Models\ServicePrice;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;

class MedicalServiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = MedicalService::with('category');

        // Filtros
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->get('category_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->boolean('requires_appointment')) {
            $query->where('requires_appointment', true);
        }

        if ($request->boolean('requires_preparation')) {
            $query->where('requires_preparation', true);
        }

        $services = $query
            ->withCount(['servicePrices as active_prices_count' => function ($query) {
                $query->active();
            }])
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        $categories = ServiceCategory::active()->orderBy('name')->get();

        return Inertia::render('Medical/MedicalServices/Index', [
            'services' => $services,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category_id', 'status', 'requires_appointment', 'requires_preparation']),
            'stats' => [
                'total' => MedicalService::count(),
                'active' => MedicalService::where('status', 'active')->count(),
                'with_appointment' => MedicalService::where('requires_appointment', true)->count(),
                'with_preparation' => MedicalService::where('requires_preparation', true)->count(),
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $categories = ServiceCategory::active()->orderBy('name')->get();
        
        return Inertia::render('Medical/MedicalServices/Create', [
            'categories' => $categories,
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
            'name' => ['required', 'string', 'max:200'],
            'code' => ['nullable', 'string', 'max:50', 'unique:medical_services'],
            'description' => ['nullable', 'string'],
            'category_id' => ['required', 'exists:service_categories,id'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:480'],
            'requires_appointment' => ['required', 'boolean'],
            'requires_preparation' => ['required', 'boolean'],
            'preparation_instructions' => ['required_if:requires_preparation,true', 'nullable', 'string'],
            'default_commission_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $service = MedicalService::create($validated);

        return redirect()
            ->route('medical-services.show', $service)
            ->with('message', 'Servicio médico creado exitosamente. Ahora puede configurar los precios por tipo de seguro.');
    }

    /**
     * Display the specified resource.
     */
    public function show(MedicalService $medicalService): Response
    {
        $medicalService->load('category');
        $medicalService->loadCount([
            'servicePrices as total_prices_count',
            'servicePrices as active_prices_count' => function ($query) {
                $query->active();
            }
        ]);

        // Obtener precios actuales por tipo de seguro
        $currentPrices = $medicalService->currentPrices()
            ->with('insuranceType')
            ->orderBy('effective_from', 'desc')
            ->get()
            ->groupBy('insurance_type_id');

        $insuranceTypes = InsuranceType::active()->orderBy('name')->get();
        $pricesByInsurance = $insuranceTypes->map(function ($insurance) use ($currentPrices) {
            $price = $currentPrices->get($insurance->id)?->first();
            return [
                'insurance' => $insurance,
                'current_price' => $price,
                'has_price' => $price !== null,
            ];
        });

        // Historial de precios recientes
        $recentPrices = $medicalService->servicePrices()
            ->with('insuranceType', 'creator')
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('Medical/MedicalServices/Show', [
            'service' => $medicalService,
            'pricesByInsurance' => $pricesByInsurance,
            'recentPrices' => $recentPrices,
            'insuranceTypes' => $insuranceTypes,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(MedicalService $medicalService): Response
    {
        $medicalService->load('category');
        $categories = ServiceCategory::active()->orderBy('name')->get();
        
        return Inertia::render('Medical/MedicalServices/Edit', [
            'service' => $medicalService,
            'categories' => $categories,
            'statusOptions' => [
                ['value' => 'active', 'label' => 'Activo'],
                ['value' => 'inactive', 'label' => 'Inactivo'],
            ]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MedicalService $medicalService): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'code' => ['nullable', 'string', 'max:50', Rule::unique('medical_services')->ignore($medicalService)],
            'description' => ['nullable', 'string'],
            'category_id' => ['required', 'exists:service_categories,id'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:480'],
            'requires_appointment' => ['required', 'boolean'],
            'requires_preparation' => ['required', 'boolean'],
            'preparation_instructions' => ['required_if:requires_preparation,true', 'nullable', 'string'],
            'default_commission_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $medicalService->update($validated);

        return redirect()
            ->route('medical-services.show', $medicalService)
            ->with('message', 'Servicio médico actualizado exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MedicalService $medicalService): RedirectResponse
    {
        // Verificar si tiene precios asociados
        if ($medicalService->servicePrices()->exists()) {
            return redirect()
                ->route('medical-services.index')
                ->with('error', 'No se puede eliminar el servicio médico porque tiene precios asociados.');
        }

        $medicalService->delete();

        return redirect()
            ->route('medical-services.index')
            ->with('message', 'Servicio médico eliminado exitosamente.');
    }

    /**
     * Store a new price for the service.
     */
    public function storePrice(Request $request, MedicalService $medicalService): RedirectResponse
    {
        $validated = $request->validate([
            'insurance_type_id' => ['required', 'exists:insurance_types,id'],
            'price' => ['required', 'numeric', 'min:0'],
            'effective_from' => ['required', 'date'],
            'effective_until' => ['nullable', 'date', 'after:effective_from'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $validated['service_id'] = $medicalService->id;
        $validated['created_by'] = auth()->id();

        ServicePrice::create($validated);

        return redirect()
            ->route('medical-services.show', $medicalService)
            ->with('message', 'Precio agregado exitosamente.');
    }

    /**
     * Get price calculation preview.
     */
    public function calculateCommission(Request $request, MedicalService $medicalService)
    {
        $request->validate([
            'price' => ['required', 'numeric', 'min:0'],
            'custom_percentage' => ['nullable', 'numeric', 'min:0', 'max:100']
        ]);

        $commission = $medicalService->calculateCommission(
            $request->get('price'),
            $request->get('custom_percentage')
        );

        return response()->json([
            'commission' => $commission,
            'formatted_commission' => '₲ ' . number_format($commission, 0, ',', '.'),
            'percentage_used' => $request->get('custom_percentage') ?? $medicalService->default_commission_percentage,
        ]);
    }
}
