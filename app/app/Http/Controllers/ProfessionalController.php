<?php

namespace App\Http\Controllers;

use App\Models\Professional;
use App\Models\MedicalService;
use App\Models\ProfessionalCommission;
use App\Models\ProfessionalCommissionSettings;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

/**
 * ProfessionalController
 * 
 * Manages medical professionals with commission tracking and service assignments.
 * Handles CRUD operations for professionals including commission calculations,
 * specialty management, and performance analytics.
 */
class ProfessionalController extends Controller
{
    /**
     * Display a listing of medical professionals.
     * 
     * Features:
     * - Filtering by status, specialty, commission rates
     * - Search by name, identification, email
     * - Performance statistics and commission totals
     * - Pagination with customizable page size
     * 
     * @param Request $request
     * @return Response
     */
    public function index(Request $request): Response
    {
        $query = Professional::query()
            ->with(['commissionSettings', 'commissions', 'services', 'specialties'])
            ->withCount(['commissions', 'services']);

        // Search functionality
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('document_number', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('specialties', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Status filter
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        // Specialty filter
        if ($specialtyId = $request->get('specialty_id')) {
            $query->whereHas('specialties', function($q) use ($specialtyId) {
                $q->where('specialty_id', $specialtyId);
            });
        }

        // Commission rate filter
        if ($minCommission = $request->get('min_commission')) {
            $query->where('commission_percentage', '>=', $minCommission);
        }

        if ($maxCommission = $request->get('max_commission')) {
            $query->where('commission_percentage', '<=', $maxCommission);
        }

        // Sorting
        $sortField = $request->get('sort', 'last_name');
        $sortDirection = $request->get('direction', 'asc');
        
        if (in_array($sortField, ['first_name', 'last_name', 'specialty', 'commission_percentage', 'created_at'])) {
            $query->orderBy($sortField, $sortDirection);
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $professionalsPaginated = $query->paginate($perPage)->withQueryString();

        // Map professionals to include commission from commissionSettings
        $professionals = $professionalsPaginated->through(function ($professional) {
            // Get commission from commissionSettings, fallback to commission_percentage field
            $commission = $professional->commissionSettings?->commission_percentage 
                ?? $professional->commission_percentage 
                ?? null;
            
            return [
                'id' => $professional->id,
                'first_name' => $professional->first_name,
                'last_name' => $professional->last_name,
                'document_type' => $professional->document_type,
                'document_number' => $professional->document_number,
                'email' => $professional->email,
                'phone' => $professional->phone,
                'license_number' => $professional->license_number,
                'commission_percentage' => $commission,
                'is_active' => $professional->status === 'active',
                'status' => $professional->status,
                'created_at' => $professional->created_at,
                'specialties' => $professional->specialties ?? [],
                'services' => $professional->services ?? [],
                'commissionSettings' => $professional->commissionSettings,
            ];
        });

        // Statistics
        $stats = [
            'total' => Professional::count(),
            'active' => Professional::where('status', 'active')->count(),
            'inactive' => Professional::where('status', 'inactive')->count(),
            'specialties' => Professional::has('specialties')->count(),
            'avg_commission' => (float) (ProfessionalCommissionSettings::avg('commission_percentage') ?? Professional::where('status', 'active')->avg('commission_percentage') ?? 0),
            'total_commissions' => (float) (ProfessionalCommission::sum('commission_amount') ?? 0)
        ];

        // Available specialties for filter
        $specialties = \App\Models\Specialty::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('medical/professionals/Index', [
            'professionals' => $professionals,
            'filters' => $request->only(['search', 'status', 'specialty_id', 'min_commission', 'max_commission', 'sort', 'direction']),
            'stats' => $stats,
            'specialties' => $specialties,
        ]);
    }

    /**
     * Show the form for creating a new professional.
     * 
     * @return Response
     */
    public function create(): Response
    {
        $services = MedicalService::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);
            
        $specialties = \App\Models\Specialty::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('medical/professionals/Create', [
            'services' => $services,
            'specialties' => $specialties,
        ]);
    }

    /**
     * Store a newly created professional in storage.
     * 
     * @param Request $request
     * @return RedirectResponse
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'identification' => ['nullable', 'string', 'max:20', 'unique:professionals,identification'],
            'email' => ['nullable', 'email', 'max:255', 'unique:professionals,email'],
            'phone' => ['nullable', 'string', 'max:15'],
            'license_number' => ['nullable', 'string', 'max:50', 'unique:professionals,license_number'],
            'commission_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'address' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
            'services' => ['array'],
            'services.*' => ['exists:medical_services,id'],
            'specialties' => ['required', 'array', 'min:1'],
            'specialties.*' => ['exists:specialties,id']
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);
        
        // Set additional required fields
        $validated['document_type'] = 'CI';
        $validated['document_number'] = $validated['identification'] ?: 'Sin identificación';
        $validated['status'] = $validated['is_active'] ? 'active' : 'inactive';

        $professional = Professional::create($validated);

        // Attach specialties with first one as primary
        if (!empty($validated['specialties'])) {
            $specialtyData = [];
            foreach ($validated['specialties'] as $index => $specialtyId) {
                $specialtyData[$specialtyId] = ['is_primary' => $index === 0];
            }
            $professional->specialties()->attach($specialtyData);
        }

        // Attach services if provided
        if (!empty($validated['services'])) {
            $professional->services()->attach($validated['services']);
        }

        return redirect()->route('medical.professionals.index')
            ->with('message', "Profesional {$professional->full_name} creado exitosamente.");
    }

    /**
     * Display the specified professional with detailed information.
     * 
     * @param Professional $professional
     * @return Response
     */
    public function show(Professional $professional): Response
    {
        $professional->load([
            'services' => function ($query) {
                $query->withPivot('created_at')->orderBy('name');
            },
            'commissions' => function ($query) {
                $query->with('patient')->orderBy('created_at', 'desc')->take(10);
            }
        ]);

        // Commission statistics
        $commissionStats = [
            'total_amount' => $professional->commissions()->sum('commission_amount'),
            'total_count' => $professional->commissions()->count(),
            'current_month' => $professional->commissions()
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('commission_amount'),
            'avg_per_service' => $professional->commissions()->avg('commission_amount'),
        ];

        return Inertia::render('medical/professionals/Show', [
            'professional' => $professional,
            'commissionStats' => $commissionStats,
        ]);
    }

    /**
     * Show the form for editing the specified professional.
     * 
     * @param Professional $professional
     * @return Response
     */
    public function edit(Professional $professional): Response
    {
        $professional->load(['services', 'specialties']);
        
        $services = MedicalService::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);
            
        $specialties = \App\Models\Specialty::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('medical/professionals/Edit', [
            'professional' => $professional,
            'services' => $services,
            'specialties' => $specialties,
        ]);
    }

    /**
     * Update the specified professional in storage.
     * 
     * @param Request $request
     * @param Professional $professional
     * @return RedirectResponse
     */
    public function update(Request $request, Professional $professional): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'identification' => ['nullable', 'string', 'max:20', Rule::unique('professionals')->ignore($professional->id)],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('professionals')->ignore($professional->id)],
            'phone' => ['nullable', 'string', 'max:15'],
            'license_number' => ['nullable', 'string', 'max:50', Rule::unique('professionals')->ignore($professional->id)],
            'commission_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'address' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
            'services' => ['array'],
            'services.*' => ['exists:medical_services,id'],
            'specialties' => ['required', 'array', 'min:1'],
            'specialties.*' => ['exists:specialties,id']
        ]);

        $validated['is_active'] = $request->boolean('is_active');

        $professional->update($validated);

        // Sync specialties with first one as primary
        if (!empty($validated['specialties'])) {
            $specialtyData = [];
            foreach ($validated['specialties'] as $index => $specialtyId) {
                $specialtyData[$specialtyId] = ['is_primary' => $index === 0];
            }
            $professional->specialties()->sync($specialtyData);
        }

        // Sync services
        if (array_key_exists('services', $validated)) {
            $professional->services()->sync($validated['services'] ?? []);
        }

        return redirect()->route('medical.professionals.show', $professional)
            ->with('message', "Profesional {$professional->full_name} actualizado exitosamente.");
    }

    /**
     * Remove the specified professional from storage.
     * 
     * @param Professional $professional
     * @return RedirectResponse
     */
    public function destroy(Professional $professional): RedirectResponse
    {
        // Check if professional has commissions
        if ($professional->commissions()->exists()) {
            return redirect()->route('medical.professionals.index')
                ->with('error', 'No se puede eliminar el profesional porque tiene comisiones registradas. Considere desactivarlo en su lugar.');
        }

        $fullName = $professional->full_name;
        $professional->services()->detach(); // Remove service associations
        $professional->delete();

        return redirect()->route('medical.professionals.index')
            ->with('message', "Profesional {$fullName} eliminado exitosamente.");
    }

    /**
     * Get commission report for a professional.
     * 
     * @param Request $request
     * @param Professional $professional
     * @return Response
     */
    public function commissionReport(Request $request, Professional $professional): Response
    {
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'per_page' => ['integer', 'min:5', 'max:100']
        ]);

        $query = $professional->commissions()
            ->with(['patient', 'medicalService']);

        if ($validated['start_date']) {
            $query->whereDate('created_at', '>=', $validated['start_date']);
        }

        if ($validated['end_date']) {
            $query->whereDate('created_at', '<=', $validated['end_date']);
        }

        $commissions = $query->orderBy('created_at', 'desc')
            ->paginate($validated['per_page'] ?? 15)
            ->withQueryString();

        $summary = [
            'total_amount' => $query->sum('commission_amount'),
            'total_count' => $query->count(),
            'date_range' => [
                'start' => $validated['start_date'],
                'end' => $validated['end_date']
            ]
        ];

        return Inertia::render('medical/professionals/CommissionReport', [
            'professional' => $professional,
            'commissions' => $commissions,
            'summary' => $summary,
            'filters' => $request->only(['start_date', 'end_date'])
        ]);
    }

    /**
     * Toggle professional active status.
     * 
     * @param Professional $professional
     * @return RedirectResponse
     */
    public function toggleStatus(Professional $professional): RedirectResponse
    {
        $professional->update(['is_active' => !$professional->is_active]);
        
        $status = $professional->is_active ? 'activado' : 'desactivado';
        
        return redirect()->back()
            ->with('success', "Profesional {$professional->full_name} {$status} exitosamente.");
    }

    /**
     * API endpoint para obtener profesionales activos
     * Utilizado por hooks frontend para cargar datos dinámicamente
     * GET /medical/reception/professionals
     */
    public function apiGetProfessionals()
    {
        try {
            $professionals = Professional::where('status', 'active')
                ->with('commissionSettings')
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get()
                ->map(function ($professional) {
                    return [
                        'id' => $professional->id,
                        'first_name' => $professional->first_name,
                        'last_name' => $professional->last_name,
                        'full_name' => $professional->full_name,
                        'document_type' => $professional->document_type,
                        'document_number' => $professional->document_number,
                        'phone' => $professional->phone,
                        'email' => $professional->email,
                        'status' => $professional->status,
                        'commission_percentage' => $professional->commissionSettings?->commission_percentage ?? $professional->commission_percentage ?? 0,
                    ];
                });

            return response()->json([
                'professionals' => $professionals,
                'total' => count($professionals),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching professionals: ' . $e->getMessage());
            return response()->json(['error' => 'Error fetching professionals'], 500);
        }
    }

    /**
     * Search for professionals (for SearchableInput component)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function search(Request $request)
    {
        try {
            $query = $request->get('q', '');
            
            if (strlen($query) < 1) {
                return response()->json([]);
            }

            $professionals = Professional::where('status', 'active')
                ->with('commissionSettings')
                ->where(function ($q) use ($query) {
                    $q->where('first_name', 'like', "%{$query}%")
                      ->orWhere('last_name', 'like', "%{$query}%")
                      ->orWhere('document_number', 'like', "%{$query}%")
                      ->orWhere('email', 'like', "%{$query}%");
                })
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->limit(15)
                ->get()
                ->map(function ($professional) {
                    return [
                        'id' => $professional->id,
                        'label' => $professional->full_name,
                        'subtitle' => $professional->email ?? $professional->document_number,
                        'full_name' => $professional->full_name,
                        'commission_percentage' => $professional->commissionSettings?->commission_percentage ?? $professional->commission_percentage ?? 0,
                    ];
                });

            return response()->json($professionals);
        } catch (\Exception $e) {
            \Log::error('Error searching professionals: ' . $e->getMessage());
            return response()->json([], 500);
        }
    }
}
