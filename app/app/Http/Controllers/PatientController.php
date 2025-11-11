<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\InsuranceType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;

class PatientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Patient::query();

        if ($request->search) {
            $query->search($request->search);
        }

        if ($request->insurance_type_id) {
            // Search in both legacy and many-to-many relationships
            $query->where(function ($q) use ($request) {
                $q->where('insurance_type_id', $request->insurance_type_id)
                  ->orWhereHas('insurances', function ($subQ) use ($request) {
                      $subQ->where('insurance_type_id', $request->insurance_type_id)
                           ->wherePivot('status', 'active');
                  });
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->valid_insurance_only) {
            $query->withValidInsurance();
        }

        $patients = $query
            ->with(['insuranceType', 'insurances'])
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->paginate(15)
            ->withQueryString();

        // Transform patients to include insurance info
        $patients->getCollection()->transform(function ($patient) {
            $patient->total_insurances = $patient->insurances->count();
            $patient->primary_insurance_info = $patient->getPrimaryInsuranceInfo();
            return $patient;
        });

        $insuranceTypes = InsuranceType::active()->orderBy('name')->get();

        return Inertia::render('medical/patients/Index', [
            'patients' => $patients,
            'insuranceTypes' => $insuranceTypes,
            'filters' => $request->only(['search', 'insurance_type_id', 'status', 'valid_insurance_only']),
            'stats' => [
                'total' => Patient::count(),
                'active' => Patient::where('status', 'active')->count(),
                'inactive' => Patient::where('status', 'inactive')->count(),
                'with_insurance' => Patient::whereNotNull('insurance_type_id')->count() + Patient::has('insurances')->count(),
                'recent_appointments' => 0, // Placeholder para futuras funcionalidades
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $insuranceTypes = InsuranceType::active()->orderBy('name')->get();
        
        return Inertia::render('medical/patients/Create', [
            'insuranceTypes' => $insuranceTypes,
            'documentTypes' => [
                ['value' => 'CI', 'label' => 'Cédula de Identidad'],
                ['value' => 'RUC', 'label' => 'RUC'],
                ['value' => 'PASSPORT', 'label' => 'Pasaporte'],
            ],
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
            'document_type' => ['required', 'in:CI,RUC,PASSPORT'],
            'document_number' => ['required', 'string', 'max:20', 'unique:patients'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'birth_date' => ['required', 'date', 'before:today'],
            'gender' => ['nullable', 'in:M,F,OTHER'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:100'],
            'address' => ['nullable', 'string', 'max:200'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'status' => ['required', 'in:active,inactive'],
            'notes' => ['nullable', 'string', 'max:1000'],
            // Insurance data (optional, will be handled by the model's booted method if not provided)
            'primary_insurance_type_id' => ['nullable', 'exists:insurance_types,id'],
            'primary_insurance_number' => ['required_with:primary_insurance_type_id', 'nullable', 'string', 'max:50'],
            'primary_insurance_valid_until' => ['nullable', 'date', 'after:today'],
            'primary_insurance_coverage_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        // Create patient (this will auto-assign Particular insurance via model boot)
        $patient = Patient::create(collect($validated)->except([
            'primary_insurance_type_id',
            'primary_insurance_number', 
            'primary_insurance_valid_until',
            'primary_insurance_coverage_percentage'
        ])->toArray());

        // If primary insurance data was provided, override the default
        if ($request->primary_insurance_type_id) {
            // Remove the auto-assigned Particular insurance
            $patient->insurances()->detach();
            
            // Add the specified primary insurance
            $patient->addInsurance($request->primary_insurance_type_id, [
                'insurance_number' => $request->primary_insurance_number,
                'valid_until' => $request->primary_insurance_valid_until,
                'coverage_percentage' => $request->primary_insurance_coverage_percentage ?? 100.00,
                'is_primary' => true,
                'notes' => 'Seguro primario asignado durante creación'
            ]);
        }

        return redirect()
            ->route('medical.patients.index')
            ->with('message', "Paciente {$patient->full_name} creado exitosamente.");
    }

    /**
     * Display the specified resource.
     */
    public function show(Patient $patient): Response
    {
        $patient->load(['insuranceType', 'insurances']);

        return Inertia::render('medical/patients/Show', [
            'patient' => $patient,
            'primaryInsurance' => $patient->getPrimaryInsuranceInfo(),
            'allInsurances' => $patient->insurances->map(function ($insurance) {
                return [
                    'id' => $insurance->id,
                    'name' => $insurance->name,
                    'code' => $insurance->code,
                    'number' => $insurance->pivot->insurance_number,
                    'valid_from' => $insurance->pivot->valid_from,
                    'valid_until' => $insurance->pivot->valid_until,
                    'coverage_percentage' => $insurance->pivot->coverage_percentage,
                    'is_primary' => $insurance->pivot->is_primary,
                    'status' => $insurance->pivot->status,
                    'notes' => $insurance->pivot->notes,
                ];
            }),
            'insuranceValid' => $patient->hasValidInsurance(),
            'totalInsurances' => $patient->insurances->count(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Patient $patient): Response
    {
        $patient->load('insuranceType');
        $insuranceTypes = InsuranceType::active()->orderBy('name')->get();
        
        return Inertia::render('medical/patients/Edit', [
            'patient' => $patient,
            'insuranceTypes' => $insuranceTypes,
            'documentTypes' => [
                ['value' => 'CI', 'label' => 'Cédula de Identidad'],
                ['value' => 'RUC', 'label' => 'RUC'],
                ['value' => 'PASSPORT', 'label' => 'Pasaporte'],
            ],
            'statusOptions' => [
                ['value' => 'active', 'label' => 'Activo'],
                ['value' => 'inactive', 'label' => 'Inactivo'],
            ]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Patient $patient): RedirectResponse
    {
        $validated = $request->validate([
            'document_type' => ['required', 'in:CI,RUC,PASSPORT'],
            'document_number' => ['required', 'string', 'max:20', Rule::unique('patients')->ignore($patient)],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'birth_date' => ['required', 'date', 'before:today'],
            'gender' => ['nullable', 'in:male,female,other'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:100'],
            'address' => ['nullable', 'string', 'max:200'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'insurance_type_id' => ['nullable', 'exists:insurance_types,id'],
            'insurance_number' => ['required_with:insurance_type_id', 'nullable', 'string', 'max:50'],
            'insurance_valid_until' => ['nullable', 'date', 'after:today'],
            'insurance_coverage_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'status' => ['required', 'in:active,inactive'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $patient->update($validated);

        return redirect()
            ->route('medical.patients.show', $patient)
            ->with('message', 'Paciente actualizado exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Patient $patient): RedirectResponse
    {
        // En un sistema real, probablemente no se eliminarían pacientes
        // sino que se marcarían como inactivos por temas de auditoría
        
        $patient->update(['status' => 'inactive']);

        return redirect()
            ->route('medical.patients.index')
            ->with('message', 'Paciente marcado como inactivo.');
    }

    /**
     * Search patients for autocomplete.
     */
    public function search(Request $request)
    {
        $request->validate([
            'q' => ['required', 'string', 'min:2']
        ]);

        $query = $request->get('q');
        
        $patients = Patient::where('status', 'active')
            ->where(function ($q) use ($query) {
                $q->where('first_name', 'like', "%{$query}%")
                  ->orWhere('last_name', 'like', "%{$query}%")
                  ->orWhere('document_number', 'like', "%{$query}%")
                  ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$query}%"]);
            })
            ->with('insuranceType')
            ->limit(5)
            ->get()
            ->map(function ($patient) {
                return [
                    'id' => $patient->id,
                    'label' => $patient->full_name,
                    'subtitle' => $patient->formatted_document . ' - ' . $patient->age . ' años - ' . $patient->insurance_info,
                    'full_name' => $patient->full_name,
                    'document' => $patient->formatted_document,
                    'age' => $patient->age,
                    'insurance_info' => $patient->insurance_info,
                    'has_valid_insurance' => $patient->hasValidInsurance(),
                ];
            });

        return response()->json($patients);
    }

    /**
     * Add an insurance to a patient.
     */
    public function addInsurance(Request $request, Patient $patient): RedirectResponse
    {
        $validated = $request->validate([
            'insurance_type_id' => ['required', 'exists:insurance_types,id'],
            'insurance_number' => ['required', 'string', 'max:50'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'coverage_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'is_primary' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        // Check if this insurance type already exists for this patient
        $exists = $patient->insurances()->where('insurance_type_id', $validated['insurance_type_id'])->exists();
        
        if ($exists) {
            return redirect()->back()->withErrors([
                'insurance_type_id' => 'Este paciente ya tiene este tipo de seguro asignado.'
            ]);
        }

        $patient->addInsurance($validated['insurance_type_id'], [
            'insurance_number' => $validated['insurance_number'],
            'valid_from' => $validated['valid_from'] ?? now(),
            'valid_until' => $validated['valid_until'],
            'coverage_percentage' => $validated['coverage_percentage'],
            'is_primary' => $validated['is_primary'] ?? false,
            'notes' => $validated['notes'],
        ]);

        return redirect()->back()->with('message', 'Seguro agregado exitosamente.');
    }

    /**
     * Update an insurance for a patient.
     */
    public function updateInsurance(Request $request, Patient $patient, int $insuranceTypeId): RedirectResponse
    {
        $validated = $request->validate([
            'insurance_number' => ['required', 'string', 'max:50'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'coverage_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'is_primary' => ['boolean'],
            'status' => ['required', 'in:active,inactive,expired'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        // If setting as primary, remove primary from others
        if ($validated['is_primary'] ?? false) {
            $patient->insurances()->updateExistingPivot(
                $patient->insurances()->where('insurance_type_id', '!=', $insuranceTypeId)->pluck('insurance_types.id'),
                ['is_primary' => false]
            );
        }

        $patient->insurances()->updateExistingPivot($insuranceTypeId, $validated);

        return redirect()->back()->with('message', 'Seguro actualizado exitosamente.');
    }

    /**
     * Remove an insurance from a patient.
     */
    public function removeInsurance(Patient $patient, int $insuranceTypeId): RedirectResponse
    {
        $insurance = $patient->insurances()->where('insurance_type_id', $insuranceTypeId)->first();
        
        if (!$insurance) {
            return redirect()->back()->withErrors([
                'error' => 'Este seguro no existe para el paciente.'
            ]);
        }

        // Don't allow removing the last active insurance
        $activeInsurancesCount = $patient->insurances()->wherePivot('status', 'active')->count();
        
        if ($activeInsurancesCount <= 1 && $insurance->pivot->status === 'active') {
            return redirect()->back()->withErrors([
                'error' => 'No se puede eliminar el último seguro activo del paciente.'
            ]);
        }

        $patient->insurances()->detach($insuranceTypeId);

        return redirect()->back()->with('message', 'Seguro eliminado exitosamente.');
    }
}
