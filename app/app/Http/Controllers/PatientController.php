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
        $query = Patient::with('insuranceType');

        // Filtros y búsqueda
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->search($search);
        }

        if ($request->filled('insurance_type_id')) {
            $query->where('insurance_type_id', $request->get('insurance_type_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->boolean('valid_insurance_only')) {
            $query->withValidInsurance();
        }

        $patients = $query
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->paginate(15)
            ->withQueryString();

        $insuranceTypes = InsuranceType::active()->orderBy('name')->get();

        return Inertia::render('Medical/Patients/Index', [
            'patients' => $patients,
            'insuranceTypes' => $insuranceTypes,
            'filters' => $request->only(['search', 'insurance_type_id', 'status', 'valid_insurance_only']),
            'stats' => [
                'total' => Patient::count(),
                'active' => Patient::where('status', 'active')->count(),
                'with_insurance' => Patient::whereNotNull('insurance_type_id')->count(),
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $insuranceTypes = InsuranceType::active()->orderBy('name')->get();
        
        return Inertia::render('Medical/Patients/Create', [
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
            'date_of_birth' => ['required', 'date', 'before:today'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:100'],
            'address' => ['nullable', 'string', 'max:200'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'insurance_type_id' => ['nullable', 'exists:insurance_types,id'],
            'insurance_number' => ['required_with:insurance_type_id', 'nullable', 'string', 'max:50'],
            'insurance_expiry_date' => ['nullable', 'date', 'after:today'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $patient = Patient::create($validated);

        return redirect()
            ->route('patients.show', $patient)
            ->with('message', 'Paciente creado exitosamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Patient $patient): Response
    {
        $patient->load('insuranceType');

        return Inertia::render('Medical/Patients/Show', [
            'patient' => $patient,
            'insuranceValid' => $patient->hasValidInsurance(),
            'insuranceExpiresSoon' => $patient->insuranceExpiresSoon(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Patient $patient): Response
    {
        $patient->load('insuranceType');
        $insuranceTypes = InsuranceType::active()->orderBy('name')->get();
        
        return Inertia::render('Medical/Patients/Edit', [
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
            'date_of_birth' => ['required', 'date', 'before:today'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:100'],
            'address' => ['nullable', 'string', 'max:200'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'insurance_type_id' => ['nullable', 'exists:insurance_types,id'],
            'insurance_number' => ['required_with:insurance_type_id', 'nullable', 'string', 'max:50'],
            'insurance_expiry_date' => ['nullable', 'date', 'after:today'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $patient->update($validated);

        return redirect()
            ->route('patients.show', $patient)
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
            ->route('patients.index')
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

        $patients = Patient::search($request->get('q'))
            ->active()
            ->with('insuranceType')
            ->limit(10)
            ->get()
            ->map(function ($patient) {
                return [
                    'id' => $patient->id,
                    'full_name' => $patient->full_name,
                    'document' => $patient->formatted_document,
                    'age' => $patient->age,
                    'insurance_info' => $patient->insurance_info,
                    'has_valid_insurance' => $patient->hasValidInsurance(),
                ];
            });

        return response()->json($patients);
    }
}
