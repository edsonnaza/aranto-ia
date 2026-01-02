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
            'professionals' => \App\Models\Professional::select('id', 'first_name', 'last_name', 'commission_percentage')
                ->where('commission_percentage', '>', 0)
                ->orderBy('last_name')
                ->get(),
            'liquidations' => $paginatedLiquidations->setCollection($liquidations),
            'pendingApprovals' => $pendingApprovals,
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

            return response()->json([
                'details' => $details,
                'count' => $details->count(),
                'total_services' => $details->sum('service_amount'),
                'total_commission' => $details->sum('commission_amount'),
            ]);
        } catch (\Exception $e) {
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

            $query = CommissionLiquidation::with(['professional.specialties', 'professional.user'])
                ->whereIn('status', [CommissionLiquidation::STATUS_DRAFT, CommissionLiquidation::STATUS_APPROVED, CommissionLiquidation::STATUS_PAID]);

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
                    'professional_name' => $professional ? $professional->user?->name ?? "{$professional->first_name} {$professional->last_name}" : 'Desconocido',
                    'specialty_name' => $professional && $professional->specialties?->first() 
                        ? $professional->specialties->first()->name 
                        : 'N/A',
                    'total_services' => $group->sum('total_services'),
                    'total_service_amount' => $totalGrossAmount,
                    'commission_percentage' => $commissionPercentage,
                    'commission_amount' => $commissionAmount,
                    'liquidation_status' => $group->first(fn($l) => $l->status === CommissionLiquidation::STATUS_PAID)?->status ?? 'pending',
                ];
            })->values();

            // Calculate totals
            $totalCommission = $professionals->sum('commission_amount');
            $paidCommission = 0;
            $pendingCommission = 0;

            foreach ($professionals as $prof) {
                if ($prof['liquidation_status'] === CommissionLiquidation::STATUS_PAID) {
                    $paidCommission += $prof['commission_amount'];
                } else {
                    $pendingCommission += $prof['commission_amount'];
                }
            }

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
}