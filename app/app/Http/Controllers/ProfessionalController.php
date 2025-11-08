<?php

namespace App\Http\Controllers;

use App\Models\Professional;
use App\Models\MedicalService;
use App\Models\ProfessionalCommission;
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
            ->with(['commissions', 'services'])
            ->withCount(['commissions', 'services']);

        // Search functionality
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('identification', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('specialty', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($status = $request->get('status')) {
            $query->where('is_active', $status === 'active');
        }

        // Specialty filter
        if ($specialty = $request->get('specialty')) {
            $query->where('specialty', $specialty);
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
        $professionals = $query->paginate($perPage)->withQueryString();

        // Statistics
        $stats = [
            'total' => Professional::count(),
            'active' => Professional::where('is_active', true)->count(),
            'inactive' => Professional::where('is_active', false)->count(),
            'with_services' => Professional::has('services')->count(),
            'avg_commission' => Professional::where('is_active', true)->avg('commission_percentage'),
            'total_commissions' => ProfessionalCommission::sum('commission_amount')
        ];

        // Available specialties for filter
        $specialties = Professional::distinct('specialty')
            ->whereNotNull('specialty')
            ->pluck('specialty')
            ->sort()
            ->values();

        return Inertia::render('Medical/Professionals/Index', [
            'professionals' => $professionals,
            'filters' => $request->only(['search', 'status', 'specialty', 'min_commission', 'max_commission', 'sort', 'direction']),
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
        $services = MedicalService::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Medical/Professionals/Create', [
            'services' => $services,
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
            'identification' => ['required', 'string', 'max:20', 'unique:professionals,identification'],
            'email' => ['required', 'email', 'max:255', 'unique:professionals,email'],
            'phone' => ['nullable', 'string', 'max:15'],
            'specialty' => ['required', 'string', 'max:100'],
            'license_number' => ['required', 'string', 'max:50', 'unique:professionals,license_number'],
            'commission_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'address' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
            'services' => ['array'],
            'services.*' => ['exists:medical_services,id']
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);

        $professional = Professional::create($validated);

        // Attach services if provided
        if (!empty($validated['services'])) {
            $professional->services()->attach($validated['services']);
        }

        return redirect()->route('medical.professionals.index')
            ->with('success', "Profesional {$professional->full_name} creado exitosamente.");
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

        return Inertia::render('Medical/Professionals/Show', [
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
        $professional->load('services');
        
        $services = MedicalService::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Medical/Professionals/Edit', [
            'professional' => $professional,
            'services' => $services,
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
            'identification' => ['required', 'string', 'max:20', Rule::unique('professionals')->ignore($professional->id)],
            'email' => ['required', 'email', 'max:255', Rule::unique('professionals')->ignore($professional->id)],
            'phone' => ['nullable', 'string', 'max:15'],
            'specialty' => ['required', 'string', 'max:100'],
            'license_number' => ['required', 'string', 'max:50', Rule::unique('professionals')->ignore($professional->id)],
            'commission_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'address' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
            'services' => ['array'],
            'services.*' => ['exists:medical_services,id']
        ]);

        $validated['is_active'] = $request->boolean('is_active');

        $professional->update($validated);

        // Sync services
        if (array_key_exists('services', $validated)) {
            $professional->services()->sync($validated['services'] ?? []);
        }

        return redirect()->route('medical.professionals.show', $professional)
            ->with('success', "Profesional {$professional->full_name} actualizado exitosamente.");
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
            ->with('success', "Profesional {$fullName} eliminado exitosamente.");
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

        return Inertia::render('Medical/Professionals/CommissionReport', [
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
}
