<?php

namespace App\Http\Controllers;

use App\Models\InsuranceType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;

class InsuranceTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = InsuranceType::query();

        // Filtros
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

        if ($request->boolean('requires_authorization')) {
            $query->where('requires_authorization', true);
        }

        $insuranceTypes = $query
            ->withCount('servicePrices as active_prices_count')
            ->withCount('patients as patients_count')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Medical/InsuranceTypes/Index', [
            'insuranceTypes' => $insuranceTypes,
            'filters' => $request->only(['search', 'status', 'requires_authorization']),
            'stats' => [
                'total' => InsuranceType::count(),
                'active' => InsuranceType::where('status', 'active')->count(),
                'with_authorization' => InsuranceType::where('requires_authorization', true)->count(),
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Medical/InsuranceTypes/Create', [
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
            'name' => ['required', 'string', 'max:100', 'unique:insurance_types'],
            'code' => ['required', 'string', 'max:20', 'unique:insurance_types'],
            'description' => ['nullable', 'string', 'max:500'],
            'requires_authorization' => ['required', 'boolean'],
            'coverage_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'has_copay' => ['required', 'boolean'],
            'copay_amount' => ['required_if:has_copay,true', 'nullable', 'numeric', 'min:0'],
            'contact_name' => ['nullable', 'string', 'max:100'],
            'contact_phone' => ['nullable', 'string', 'max:20'],
            'contact_email' => ['nullable', 'email', 'max:100'],
            'billing_address' => ['nullable', 'string', 'max:200'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        InsuranceType::create($validated);

        return redirect()
            ->route('insurance-types.index')
            ->with('message', 'Tipo de seguro creado exitosamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(InsuranceType $insuranceType): Response
    {
        $insuranceType->loadCount([
            'servicePrices as active_prices_count',
            'patients as active_patients_count' => function ($query) {
                $query->where('status', 'active');
            }
        ]);

        // Obtener algunos ejemplos de precios y pacientes
        $recentPrices = $insuranceType->servicePrices()
            ->with('medicalService')
            ->latest()
            ->limit(5)
            ->get();

        $recentPatients = $insuranceType->patients()
            ->where('status', 'active')
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('Medical/InsuranceTypes/Show', [
            'insuranceType' => $insuranceType,
            'recentPrices' => $recentPrices,
            'recentPatients' => $recentPatients,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(InsuranceType $insuranceType): Response
    {
        return Inertia::render('Medical/InsuranceTypes/Edit', [
            'insuranceType' => $insuranceType,
            'statusOptions' => [
                ['value' => 'active', 'label' => 'Activo'],
                ['value' => 'inactive', 'label' => 'Inactivo'],
            ]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, InsuranceType $insuranceType): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('insurance_types')->ignore($insuranceType)],
            'code' => ['required', 'string', 'max:20', Rule::unique('insurance_types')->ignore($insuranceType)],
            'description' => ['nullable', 'string', 'max:500'],
            'requires_authorization' => ['required', 'boolean'],
            'coverage_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'has_copay' => ['required', 'boolean'],
            'copay_amount' => ['required_if:has_copay,true', 'nullable', 'numeric', 'min:0'],
            'contact_name' => ['nullable', 'string', 'max:100'],
            'contact_phone' => ['nullable', 'string', 'max:20'],
            'contact_email' => ['nullable', 'email', 'max:100'],
            'billing_address' => ['nullable', 'string', 'max:200'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $insuranceType->update($validated);

        return redirect()
            ->route('insurance-types.index')
            ->with('message', 'Tipo de seguro actualizado exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(InsuranceType $insuranceType): RedirectResponse
    {
        // Verificar si tiene dependencias
        if ($insuranceType->servicePrices()->exists()) {
            return redirect()
                ->route('insurance-types.index')
                ->with('error', 'No se puede eliminar el tipo de seguro porque tiene precios asociados.');
        }

        if ($insuranceType->patients()->exists()) {
            return redirect()
                ->route('insurance-types.index')
                ->with('error', 'No se puede eliminar el tipo de seguro porque tiene pacientes asociados.');
        }

        $insuranceType->delete();

        return redirect()
            ->route('insurance-types.index')
            ->with('message', 'Tipo de seguro eliminado exitosamente.');
    }

    /**
     * Get calculation preview for patient amount.
     */
    public function calculatePreview(Request $request, InsuranceType $insuranceType)
    {
        $request->validate([
            'amount' => ['required', 'numeric', 'min:0']
        ]);

        $calculation = $insuranceType->calculatePatientAmount($request->get('amount'));

        return response()->json([
            'calculation' => $calculation,
            'formatted' => [
                'total_amount' => '₲ ' . number_format($calculation['total_amount'], 0, ',', '.'),
                'coverage_amount' => '₲ ' . number_format($calculation['coverage_amount'], 0, ',', '.'),
                'patient_amount' => '₲ ' . number_format($calculation['patient_amount'], 0, ',', '.'),
                'copay_amount' => '₲ ' . number_format($calculation['copay_amount'], 0, ',', '.'),
            ]
        ]);
    }
}
