<?php

namespace App\Http\Controllers;

use App\Models\MedicalService;
use App\Models\ServiceCategory;
use App\Models\InsuranceType;
use App\Models\ServicePrice;
use App\Helpers\ServiceCodeHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        return Inertia::render('medical/medical-services/Index', [
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
        $insuranceTypes = InsuranceType::active()->orderBy('name')->get();
        
        return Inertia::render('medical/medical-services/Create', [
            'categories' => $categories,
            'insuranceTypes' => $insuranceTypes,
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
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'], // Opcional, se generará automáticamente si no se proporciona
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'exists:service_categories,id'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'requires_appointment' => ['required', 'boolean'],
            'requires_preparation' => ['required', 'boolean'],
            'preparation_instructions' => ['nullable', 'string'],
            'default_commission_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'status' => ['required', 'string', 'in:active,inactive'],
            'prices' => ['nullable', 'array'],
            'prices.*.insurance_type_id' => ['required', 'integer', 'exists:insurance_types,id'],
            'prices.*.price' => ['required', 'numeric', 'min:0'],
            'prices.*.effective_from' => ['required', 'date'],
            'prices.*.effective_until' => ['nullable', 'date'],
            'prices.*.notes' => ['nullable', 'string'],
        ]);

        try {
            DB::beginTransaction();

            // Generar código automáticamente si no se proporciona
            $serviceCode = !empty($validated['code']) 
                ? $validated['code'] 
                : ServiceCodeHelper::generateServiceCode($validated['name'], $validated['category_id']);

            $service = MedicalService::create([
                'name' => $validated['name'],
                'code' => $serviceCode,
                'description' => $validated['description'],
                'category_id' => $validated['category_id'],
                'duration_minutes' => $validated['duration_minutes'],
                'requires_appointment' => $validated['requires_appointment'],
                'requires_preparation' => $validated['requires_preparation'],
                'preparation_instructions' => $validated['preparation_instructions'],
                'default_commission_percentage' => $validated['default_commission_percentage'],
                'status' => $validated['status'],
            ]);

            // Create service prices if provided
            if (isset($validated['prices']) && is_array($validated['prices'])) {
                foreach ($validated['prices'] as $priceData) {
                    if ($priceData['insurance_type_id'] > 0 && $priceData['price'] > 0) {
                        ServicePrice::create([
                            'service_id' => $service->id,
                            'insurance_type_id' => $priceData['insurance_type_id'],
                            'price' => $priceData['price'],
                            'effective_from' => $priceData['effective_from'],
                            'effective_until' => $priceData['effective_until'] ?? null,
                            'notes' => $priceData['notes'] ?? null,
                            'created_by' => auth()->id(),
                        ]);
                    }
                }
            }

            DB::commit();

            $message = isset($validated['prices']) && count($validated['prices']) > 0 
                ? 'Servicio médico creado exitosamente con precios configurados.'
                : 'Servicio médico creado exitosamente. Puede configurar los precios en la vista de edición.';

            return redirect()
                ->route('medical.medical-services.index')
                ->with('message', $message);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()
                ->withInput()
                ->withErrors(['general' => 'Error al crear el servicio: ' . $e->getMessage()]);
        }
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

        return Inertia::render('medical/medical-services/Show', [
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
        $medicalService->load(['category', 'prices.insuranceType']);
        $categories = ServiceCategory::active()->orderBy('name')->get();
        $insuranceTypes = InsuranceType::active()->orderBy('name')->get();
        
        return Inertia::render('medical/medical-services/Edit', [
            'service' => $medicalService,
            'categories' => $categories,
            'insuranceTypes' => $insuranceTypes,
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'exists:service_categories,id'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'requires_appointment' => ['required', 'boolean'],
            'requires_preparation' => ['required', 'boolean'],
            'preparation_instructions' => ['nullable', 'string'],
            'default_commission_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'status' => ['required', 'string', 'in:active,inactive'],
            'prices' => ['nullable', 'array'],
            'prices.*.insurance_type_id' => ['required', 'integer', 'exists:insurance_types,id'],
            'prices.*.price' => ['required', 'numeric', 'min:0'],
            'prices.*.effective_from' => ['required', 'date'],
            'prices.*.effective_until' => ['nullable', 'date'],
            'prices.*.notes' => ['nullable', 'string'],
        ]);

        try {
            DB::beginTransaction();

            // Actualizar el servicio (sin modificar el código)
            $medicalService->update([
                'name' => $validated['name'],
                'description' => $validated['description'],
                'category_id' => $validated['category_id'],
                'duration_minutes' => $validated['duration_minutes'],
                'requires_appointment' => $validated['requires_appointment'],
                'requires_preparation' => $validated['requires_preparation'],
                'preparation_instructions' => $validated['preparation_instructions'],
                'default_commission_percentage' => $validated['default_commission_percentage'],
                'status' => $validated['status'],
            ]);

            // Actualizar precios si se proporcionan
            if (isset($validated['prices']) && is_array($validated['prices'])) {
                // Desactivar precios existentes que no estén en la nueva lista
                // (en una implementación más sofisticada, podrías comparar y actualizar solo los cambios)
                
                // Crear/actualizar nuevos precios
                foreach ($validated['prices'] as $priceData) {
                    if ($priceData['insurance_type_id'] > 0 && $priceData['price'] > 0) {
                        ServicePrice::updateOrCreate(
                            [
                                'service_id' => $medicalService->id,
                                'insurance_type_id' => $priceData['insurance_type_id'],
                                'effective_from' => $priceData['effective_from'],
                            ],
                            [
                                'price' => $priceData['price'],
                                'effective_until' => $priceData['effective_until'] ?? null,
                                'notes' => $priceData['notes'] ?? null,
                                'created_by' => auth()->id(),
                            ]
                        );
                    }
                }
            }

            DB::commit();

            return redirect()
                ->route('medical.medical-services.index')
                ->with('message', 'Servicio médico actualizado exitosamente.');

        } catch (\Exception $e) {
            DB::rollback();
            
            return redirect()
                ->back()
                ->with('error', 'Error al actualizar el servicio: ' . $e->getMessage())
                ->withInput();
        }
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

    /**
     * Search medical services for autocomplete
     */
    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2|max:50'
        ]);

        $query = $request->get('q');
        
        $services = MedicalService::with('category')
            ->where('status', 'active')
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('code', 'like', "%{$query}%")
                  ->orWhere('description', 'like', "%{$query}%");
            })
            ->orderBy('name')
            ->limit(5)
            ->get()
            ->map(function ($service) {
                // Obtener el precio más reciente de cualquier tipo de seguro como referencia
                $currentPrice = $service->currentPrices()->first();
                $priceDisplay = $currentPrice ? '₲ ' . number_format($currentPrice->price, 0, ',', '.') : 'Sin precio';
                
                return [
                    'id' => $service->id,
                    'label' => $service->name,
                    'subtitle' => ($service->category ? $service->category->name : 'Sin Categoría') . ' - ' . $priceDisplay,
                    'code' => $service->code,
                    'current_price' => $currentPrice ? $currentPrice->price : null,
                    'duration_minutes' => $service->duration_minutes,
                    'category' => $service->category ? $service->category->name : 'Sin Categoría'
                ];
            });

        return response()->json($services);
    }

    /**
     * Genera un código de vista previa para un servicio
     */
    public function generateCodePreview(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'exists:service_categories,id']
        ]);

        $generatedCode = ServiceCodeHelper::generateServiceCode(
            $request->get('name'),
            $request->get('category_id')
        );

        return response()->json([
            'code' => $generatedCode,
            'is_valid' => ServiceCodeHelper::isValidCodeFormat($generatedCode),
            'is_unique' => !MedicalService::where('code', $generatedCode)->exists()
        ]);
    }
}
