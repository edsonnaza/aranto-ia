<?php

namespace App\Http\Controllers;

use App\Models\CommissionLiquidation;
use App\Services\CommissionService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CommissionController
 *
 * Handles commission liquidation management through Inertia.js views
 */
class CommissionController extends Controller
{
    public function __construct(
        private CommissionService $commissionService
    ) {}

    /**
     * Display a listing of commission liquidations.
     */
    public function index(Request $request): Response
    {
        $query = CommissionLiquidation::with(['professional.specialties', 'generatedBy', 'approvedBy'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->filled('professional_id')) {
            $query->where('professional_id', $request->professional_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Get date range filters, default to today if not provided
        $dateFrom = $request->filled('date_from') ? $request->date_from : now()->toDateString();
        $dateTo = $request->filled('date_to') ? $request->date_to : now()->toDateString();

        // Apply date range filter
        $query->whereDate('created_at', '>=', $dateFrom);
        $query->whereDate('created_at', '<=', $dateTo);

        $paginatedLiquidations = $query->paginate(20);

        // Transform liquidations to include professional data
        $liquidations = $paginatedLiquidations->map(function($liquidation) {
            $specialty = $liquidation->professional->specialties->where('pivot.is_primary', true)->first();
            return [
                'id' => $liquidation->id,
                'professional_id' => $liquidation->professional_id,
                'professional_name' => $liquidation->professional->full_name ?? 'N/A',
                'specialty_name' => $specialty?->name ?? 'Sin especialidad',
                'period_start' => $liquidation->period_start,
                'period_end' => $liquidation->period_end,
                'total_services' => $liquidation->total_services,
                'total_amount' => $liquidation->gross_amount,
                'commission_percentage' => $liquidation->commission_percentage,
                'commission_amount' => $liquidation->commission_amount,
                'created_at' => $liquidation->created_at->toDateString(),
                'status' => $liquidation->status,
            ];
        });

        // Create a new paginator with the transformed data
        $transformedPaginator = $paginatedLiquidations->setCollection(
            collect($liquidations)
        );

        // Get pending approvals (draft status only)
        $pendingApprovals = CommissionLiquidation::with(['professional.specialties'])
            ->where('status', CommissionLiquidation::STATUS_DRAFT)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function($liquidation) {
                $specialty = $liquidation->professional->specialties->where('pivot.is_primary', true)->first();
                return [
                    'id' => $liquidation->id,
                    'professional_id' => $liquidation->professional_id,
                    'professional_name' => $liquidation->professional->full_name ?? 'N/A',
                    'specialty_name' => $specialty?->name ?? 'Sin especialidad',
                    'period_start' => $liquidation->period_start,
                    'period_end' => $liquidation->period_end,
                    'total_services' => $liquidation->total_services,
                    'total_amount' => $liquidation->gross_amount,
                    'commission_percentage' => $liquidation->commission_percentage,
                    'commission_amount' => $liquidation->commission_amount,
                    'created_at' => $liquidation->created_at->toDateString(),
                    'status' => $liquidation->status,
                ];
            });

        return Inertia::render('commission/Index', [
            'professionals' => \App\Models\Professional::with('specialties')
                ->select('id', 'first_name', 'last_name', 'commission_percentage')
                ->orderBy('last_name')
                ->get(),
            'liquidations' => $transformedPaginator,
            'pendingApprovals' => $pendingApprovals,
            'filters' => [
                'professional_id' => $request->professional_id,
                'status' => $request->status,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    /**
     * Show the form for creating a new commission liquidation.
     */
    public function create(): Response
    {
        return Inertia::render('commission/Create', [
            'professionals' => \App\Models\Professional::select('id', 'first_name', 'last_name', 'commission_percentage')
                ->where('commission_percentage', '>', 0)
                ->orderBy('last_name')
                ->get(),
        ]);
    }

    /**
     * Store a newly created commission liquidation.
     */
    public function store(Request $request): RedirectResponse
    {

        $request->validate([
            'professional_id' => 'required|exists:professionals,id',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'service_request_ids' => 'required|array|min:1',
            'service_request_ids.*' => 'integer',
        ]);

        // Validate that selected services are not already liquidated
        $alreadyLiquidated = $this->commissionService->getAlreadyLiquidatedServices(
            $request->service_request_ids
        );

        if (!empty($alreadyLiquidated)) {
            return back()->withErrors(['general' => ['Algunos servicios ya han sido liquidados previamente.']]);
        }

        try {
            $liquidation = $this->commissionService->generateLiquidation(
                $request->professional_id,
                $request->period_start,
                $request->period_end,
                auth()->id(),
                $request->service_request_ids
            );

            return redirect()->route('medical.commissions.index')
                ->with('success', 'Liquidación de comisiones generada exitosamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => [$e->getMessage()]]);
        }
    }

    /**
     * Display the specified commission liquidation.
     */
    public function show(CommissionLiquidation $liquidation): Response
    {
        $liquidation->load([
            'professional',
            'generatedBy',
            'approvedBy',
            'paymentMovement',
            'details.serviceRequest.patient',
            'details.service',
            'details.paymentMovement'
        ]);

        return Inertia::render('commission/Show', [
            'liquidation' => $liquidation,
        ]);
    }

    /**
     * Show the form for editing the specified commission liquidation.
     */
    public function edit(CommissionLiquidation $liquidation): Response
    {
        // Only draft liquidations can be edited
        if (!$liquidation->isDraft()) {
            abort(403, 'Solo se pueden editar liquidaciones en estado borrador.');
        }

        return Inertia::render('commission/Edit', [
            'liquidation' => $liquidation->load(['professional', 'details']),
        ]);
    }

    /**
     * Update the specified commission liquidation.
     */
    public function update(Request $request, CommissionLiquidation $liquidation): RedirectResponse
    {
        if (!$liquidation->isDraft()) {
            return back()->withErrors(['general' => ['Solo se pueden actualizar liquidaciones en estado borrador.']]);
        }

        $request->validate([
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
        ]);

        try {
            // For now, we'll just update the period dates
            // In a more complex implementation, we might recalculate the liquidation
            $liquidation->update([
                'period_start' => $request->period_start,
                'period_end' => $request->period_end,
            ]);

            return redirect()->route('medical.commissions.show', $liquidation)
                ->with('success', 'Liquidación actualizada exitosamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => [$e->getMessage()]]);
        }
    }

    /**
     * Approve the specified commission liquidation.
     */
    public function approve(CommissionLiquidation $commission): RedirectResponse
    {
        try {
            $this->commissionService->approveLiquidation($commission, auth()->id());

            return redirect()->route('medical.commissions.show', $commission)
                ->with('success', 'Liquidación aprobada exitosamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => [$e->getMessage()]]);
        }
    }

    /**
     * Process payment for the specified commission liquidation.
     */
    public function pay(Request $request, CommissionLiquidation $commission): RedirectResponse
    {
        try {
            // Get active cash register session
            $cashRegisterService = app(\App\Services\CashRegisterService::class);
            $activeSession = $cashRegisterService->getActiveSession(auth()->user());

            if (!$activeSession) {
                return back()->withErrors(['general' => ['No hay una caja abierta. Debe abrir caja primero.']]);
            }

            $result = $this->commissionService->processPayment(
                $commission,
                $activeSession->id,
                auth()->id()
            );

            return back()->with('success', 'Pago de liquidación procesado exitosamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => [$e->getMessage()]]);
        }
    }

    /**
     * Cancel the specified commission liquidation.
     */
    public function cancel(CommissionLiquidation $commission): RedirectResponse
    {
        try {
            $this->commissionService->cancelLiquidation($commission);

            return redirect()->route('medical.commissions.index')
                ->with('success', 'Liquidación cancelada exitosamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => [$e->getMessage()]]);
        }
    }

    /**
     * Revert payment for the specified commission liquidation.
     * Only cashier manager can perform this action.
     */
    public function revertPayment(Request $request, CommissionLiquidation $commission): RedirectResponse
    {
        // Validar que el usuario tenga permiso de gestión de caja
        if (!auth()->user()->can('manage_cash_register')) {
            return back()->withErrors(['general' => ['No tiene permisos para revertir pagos de liquidaciones.']]);
        }

        $request->validate([
            'reason' => 'required|string|min:10|max:500',
        ]);

        try {
            $this->commissionService->revertPayment(
                $commission,
                auth()->id(),
                $request->reason
            );

            return redirect()->route('medical.commissions.index')
                ->with('success', 'Pago revertido exitosamente. La liquidación volvió a estado aprobado.');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => [$e->getMessage()]]);
        }
    }

    /**
     * Remove the specified commission liquidation.
     */
    public function destroy(CommissionLiquidation $liquidation): RedirectResponse
    {
        if (!$liquidation->isDraft()) {
            return back()->withErrors(['general' => ['Solo se pueden eliminar liquidaciones en estado borrador.']]);
        }

        try {
            $liquidation->delete();

            return redirect()->route('medical.commissions.index')
                ->with('success', 'Liquidación eliminada exitosamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => [$e->getMessage()]]);
        }
    }

    /**
     * Get commission report for a professional.
     */
    public function report(Request $request): Response
    {
        $request->validate([
            'professional_id' => 'required|exists:professionals,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $report = $this->commissionService->getCommissionReport(
            $request->professional_id,
            $request->start_date,
            $request->end_date
        );

        return Inertia::render('commission/Report', [
            'report' => $report,
            'filters' => $request->only(['professional_id', 'start_date', 'end_date']),
        ]);
    }

    /**
     * Get pending liquidations for approval.
     */
    public function pending(): Response
    {
        $pendingLiquidations = $this->commissionService->getPendingLiquidations();

        return Inertia::render('commission/Pending', [
            'pendingLiquidations' => $pendingLiquidations,
        ]);
    }

    /**
     * API endpoint to get commission data for a professional and period.
     */
    public function getCommissionData(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'professional_id' => 'required|exists:professionals,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        try {
            $data = $this->commissionService->getProfessionalCommissionData(
                $request->professional_id,
                $request->start_date,
                $request->end_date
            );

            return response()->json($data);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get transactions for a specific commission liquidation
     */
    public function getTransactions(CommissionLiquidation $commission): \Illuminate\Http\JsonResponse
    {
        try {
            $transactions = $commission->transactions()
                ->with(['user', 'service'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'transactions' => $transactions,
                'count' => $transactions->count(),
                'total' => $transactions->sum('amount')
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get details (items/services) for a specific commission liquidation
     */
    public function getDetails(CommissionLiquidation $commission): \Illuminate\Http\JsonResponse
    {
        try {
            $details = $commission->details()
                ->with(['serviceRequest.patient', 'service'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($detail) {
                    return [
                        'service_request_id' => $detail->service_request_id,
                        'patient_name' => $detail->serviceRequest?->patient?->full_name ?? 'N/A',
                        'service_name' => $detail->service?->name ?? 'Servicio desconocido',
                        'service_amount' => $detail->service_amount,
                        'commission_percentage' => $detail->commission_percentage,
                        'commission_amount' => $detail->commission_amount,
                        'service_date' => $detail->service_date,
                    ];
                });

            $totalServices = $details->sum('service_amount');
            $totalCommission = $details->sum('commission_amount');

            // Get professional specialty name
            $professional = $commission->load('professional.specialties')->professional;
            $specialtyName = $professional?->specialties?->first()?->name ?? 'N/A';

            return response()->json([
                'liquidation' => [
                    'id' => $commission->id,
                    'professional_name' => $professional?->full_name ?? 'N/A',
                    'professional_specialty' => $specialtyName,
                    'period_start' => $commission->period_start,
                    'period_end' => $commission->period_end,
                    'status' => $commission->status,
                    'total_services' => $commission->total_services,
                    'gross_amount' => $commission->gross_amount,
                    'commission_percentage' => $commission->commission_percentage,
                    'commission_amount' => $commission->commission_amount,
                    'generated_at' => $commission->created_at,
                    'approved_at' => $commission->updated_at,
                ],
                'details' => $details,
                'count' => $details->count(),
                'total_services' => $totalServices,
                'total_commission' => $totalCommission,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get dashboard summary statistics
     * 
     * @return array<string, int|float>
     */
    private function getDashboardSummary(): array
    {
        // Excluir liquidaciones canceladas
        $allLiquidations = CommissionLiquidation::where('status', '!=', CommissionLiquidation::STATUS_CANCELLED)->get();
        $totalCommissions = $allLiquidations->sum('commission_amount');
        $activeProfessionals = CommissionLiquidation::distinct()->count('professional_id');
        $totalLiquidations = CommissionLiquidation::where('status', '!=', CommissionLiquidation::STATUS_CANCELLED)->count();
        $pendingLiquidations = CommissionLiquidation::whereIn('status', [
            CommissionLiquidation::STATUS_DRAFT, 
            CommissionLiquidation::STATUS_APPROVED
        ])->count();

        return [
            'total_commissions' => $totalCommissions,
            'active_professionals' => $activeProfessionals,
            'total_liquidations' => $totalLiquidations,
            'pending_liquidations' => $pendingLiquidations,
            'growth_rate' => $this->calculateGrowthRate(),
        ];
    }

    /**
     * Calculate growth rate for current month
     * 
     * @return float
     */
    private function calculateGrowthRate(): float
    {
        $currentMonthTotal = CommissionLiquidation::where('status', CommissionLiquidation::STATUS_PAID)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('commission_amount');
        
        $lastMonthTotal = CommissionLiquidation::where('status', CommissionLiquidation::STATUS_PAID)
            ->whereMonth('created_at', now()->subMonth()->month)
            ->whereYear('created_at', now()->subMonth()->year)
            ->sum('commission_amount');

        return $lastMonthTotal > 0 
            ? (($currentMonthTotal - $lastMonthTotal) / $lastMonthTotal) * 100 
            : 0;
    }

    /**
     * Get monthly trend data for dashboard
     * 
     * @return \Illuminate\Support\Collection
     */
    private function getMonthlyTrend()
    {
        return CommissionLiquidation::where('status', CommissionLiquidation::STATUS_PAID)
            ->get()
            ->groupBy(fn($item) => $item->created_at->format('Y-m'))
            ->map(fn($group) => [
                'month' => $group->first()->created_at->format('Y-m'),
                'amount' => $group->sum('commission_amount'),
                'liquidations' => $group->count(),
            ])
            ->sortBy('month')
            ->values()
            ->take(3);
    }

    /**
     * Get pending approvals for dashboard
     * 
     * @return \Illuminate\Support\Collection
     */
    private function getPendingApprovals()
    {
        return CommissionLiquidation::with(['professional'])
            ->where('status', CommissionLiquidation::STATUS_DRAFT)
            ->orderBy('created_at', 'asc')
            ->limit(5)
            ->get()
            ->map(fn($liq) => [
                'id' => $liq->id,
                'professional_name' => $liq->professional->full_name ?? 'Desconocido',
                'period_start' => $liq->period_start,
                'period_end' => $liq->period_end,
                'commission_amount' => $liq->commission_amount,
                'days_pending' => $liq->created_at->diffInDays(now()),
            ]);
    }

    /**
     * Get top professionals by commission
     * 
     * @return \Illuminate\Support\Collection
     */
    private function getTopProfessionals()
    {
        return CommissionLiquidation::with(['professional'])
            ->where('status', CommissionLiquidation::STATUS_PAID)
            ->get()
            ->groupBy('professional_id')
            ->map(function($group) {
                $first = $group->first();
                $professional = $first->professional;
                $specialty = $professional->specialties->where('pivot.is_primary', true)->first();
                
                return [
                    'id' => $professional->id,
                    'name' => $professional->full_name ?? 'Desconocido',
                    'specialty' => $specialty?->name ?? 'N/A',
                    'total_commissions' => $group->sum('commission_amount'),
                    'liquidations_count' => $group->count(),
                ];
            })
            ->sortByDesc('total_commissions')
            ->values()
            ->take(5);
    }

    /**
     * Get recent liquidations for dashboard
     * 
     * @return \Illuminate\Support\Collection
     */
    private function getRecentLiquidations()
    {
        return CommissionLiquidation::with(['professional'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function($liq) {
                $specialty = $liq->professional->specialties->where('pivot.is_primary', true)->first();
                return [
                    'id' => $liq->id,
                    'professional_name' => $liq->professional->full_name ?? 'Desconocido',
                    'specialty_name' => $specialty?->name ?? 'N/A',
                    'period_start' => $liq->period_start,
                    'period_end' => $liq->period_end,
                    'commission_amount' => $liq->commission_amount,
                    'status' => $liq->status,
                    'created_at' => $liq->created_at->toDateString(),
                ];
            });
    }

    /**
     * Get dashboard data with real statistics
     */
    public function getDashboardData(): \Illuminate\Http\JsonResponse
    {
        try {
            return response()->json([
                'summary' => $this->getDashboardSummary(),
                'monthly_trend' => $this->getMonthlyTrend(),
                'pending_approvals' => $this->getPendingApprovals(),
                'top_professionals' => $this->getTopProfessionals(),
                'recent_liquidations' => $this->getRecentLiquidations(),
            ]);
        } catch (\Exception $e) {
            \Log::error('DashboardData Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get commission report with real data
     */
    public function reportData(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $professionalId = $request->input('professional_id');

            $query = CommissionLiquidation::with(['professional.specialties'])
                ->where('status', CommissionLiquidation::STATUS_PAID);

            // Apply date filters - search within the period range
            if ($startDate) {
                $query->where('period_end', '>=', $startDate);
            }

            if ($endDate) {
                $query->where('period_start', '<=', $endDate);
            }

            if ($professionalId) {
                $query->where('professional_id', $professionalId);
            }

            $liquidations = $query->orderBy('created_at', 'desc')->get();

            // Group by professional
            $professionals = $liquidations->groupBy('professional_id')->map(function ($group) {
                $first = $group->first();
                $professional = $first->professional;
                
                // Calculate commission properly
                $totalGrossAmount = $group->sum('gross_amount');
                $commissionPercentage = $first->commission_percentage ?? 0;
                $commissionAmount = $totalGrossAmount * ($commissionPercentage / 100);

                return [
                    'professional_id' => $first->professional_id,
                    'professional_name' => $professional ? "{$professional->first_name} {$professional->last_name}" : 'Desconocido',
                    'specialty_name' => $professional && $professional->specialties?->first() 
                        ? $professional->specialties->first()->name 
                        : 'N/A',
                    'total_services' => $group->sum('total_services'),
                    'total_service_amount' => $totalGrossAmount,
                    'commission_percentage' => $commissionPercentage,
                    'commission_amount' => $commissionAmount,
                    'liquidation_status' => CommissionLiquidation::STATUS_PAID,
                ];
            })->values();

            // Calculate totals
            $totalCommission = $professionals->sum('commission_amount');
            $paidCommission = $totalCommission; // All are paid since we filtered by STATUS_PAID
            $pendingCommission = 0;

            $summary = [
                'total_liquidations' => $liquidations->count(),
                'total_commission' => $totalCommission,
                'paid_commission' => $paidCommission,
                'pending_commission' => $pendingCommission,
            ];

            $reportSummary = [
                'total_professionals' => $professionals->count(),
                'total_services' => $liquidations->sum('total_services'),
                'total_amount' => $liquidations->sum('gross_amount'),
                'total_commissions' => $totalCommission,
            ];

            return response()->json([
                'report' => [
                    'professionals' => $professionals,
                    'period' => [
                        'start' => $startDate,
                        'end' => $endDate,
                    ],
                    'summary' => $summary,
                    'liquidations' => $liquidations,
                ],
                'summary' => $reportSummary,
            ]);
        } catch (\Exception $e) {
            \Log::error('ReportData Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get professional commissions for settings
     */
    public function getProfessionalCommissions()
    {
        try {
            $commissions = \DB::table('professional_commission_settings')
                ->select('id', 'professional_id', 'commission_percentage', 'created_at', 'updated_at')
                ->get();

            return response()->json($commissions);
        } catch (\Exception $e) {
            \Log::error('ProfessionalCommissions Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Update professional commission percentage
     */
    public function updateProfessionalCommission(Request $request, $professionalId)
    {
        try {
            $validated = $request->validate([
                'commission_percentage' => 'required|numeric|min:0|max:100',
            ]);

            // Update directly in professionals table
            $professional = \App\Models\Professional::findOrFail($professionalId);
            $professional->commission_percentage = $validated['commission_percentage'];
            $professional->save();

            return response()->json([
                'message' => 'Comisión actualizada correctamente',
                'professional_id' => $professionalId,
                'commission_percentage' => $validated['commission_percentage'],
            ]);
        } catch (\Exception $e) {
            \Log::error('UpdateProfessionalCommission Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * API: Get all professional commissions (JSON response)
     */
    public function apiGetProfessionalCommissions()
    {
        try {
            $commissions = \DB::table('professional_commission_settings')
                ->select('id', 'professional_id', 'commission_percentage', 'created_at', 'updated_at')
                ->get();

            return response()->json($commissions->toArray());
        } catch (\Exception $e) {
            \Log::error('API ProfessionalCommissions Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * API: Update professional commission percentage
     */
    public function apiUpdateProfessionalCommission(Request $request, $professionalId)
    {
        try {
            $validated = $request->validate([
                'commission_percentage' => 'required|numeric|min:0|max:100',
            ]);

            // Update directly in professionals table
            $professional = \App\Models\Professional::findOrFail($professionalId);
            $professional->commission_percentage = $validated['commission_percentage'];
            $professional->save();

            return response()->json([
                'message' => 'Comisión actualizada correctamente',
                'professional_id' => $professionalId,
                'commission_percentage' => $validated['commission_percentage'],
            ]);
        } catch (\Exception $e) {
            \Log::error('API UpdateProfessionalCommission Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}