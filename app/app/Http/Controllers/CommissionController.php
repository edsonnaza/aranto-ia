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
        $query = CommissionLiquidation::with(['professional', 'generatedBy', 'approvedBy'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->filled('professional_id')) {
            $query->forProfessional($request->professional_id);
        }

        if ($request->filled('status')) {
            $query->withStatus($request->status);
        }

        if ($request->filled('period_start') && $request->filled('period_end')) {
            $query->inPeriod($request->period_start, $request->period_end);
        }

        $liquidations = $query->paginate(20);

        return Inertia::render('commissions/Index', [
            'liquidations' => $liquidations,
            'filters' => $request->only(['professional_id', 'status', 'period_start', 'period_end']),
        ]);
    }

    /**
     * Show the form for creating a new commission liquidation.
     */
    public function create(): Response
    {
        return Inertia::render('commissions/Create', [
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
        ]);

        // Validate liquidation data
        $errors = $this->commissionService->validateLiquidationData(
            $request->professional_id,
            $request->period_start,
            $request->period_end
        );

        if (!empty($errors)) {
            return back()->withErrors(['general' => $errors]);
        }

        try {
            $liquidation = $this->commissionService->generateLiquidation(
                $request->professional_id,
                $request->period_start,
                $request->period_end,
                auth()->id()
            );

            return redirect()->route('commissions.show', $liquidation)
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

        return Inertia::render('commissions/Show', [
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

        return Inertia::render('commissions/Edit', [
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

            return redirect()->route('commissions.show', $liquidation)
                ->with('success', 'Liquidación actualizada exitosamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => [$e->getMessage()]]);
        }
    }

    /**
     * Approve the specified commission liquidation.
     */
    public function approve(CommissionLiquidation $liquidation): RedirectResponse
    {
        try {
            $this->commissionService->approveLiquidation($liquidation, auth()->id());

            return redirect()->route('commissions.show', $liquidation)
                ->with('success', 'Liquidación aprobada exitosamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => [$e->getMessage()]]);
        }
    }

    /**
     * Process payment for the specified commission liquidation.
     */
    public function pay(Request $request, CommissionLiquidation $liquidation): RedirectResponse
    {
        $request->validate([
            'cash_register_session_id' => 'required|exists:cash_register_sessions,id',
        ]);

        try {
            $result = $this->commissionService->processPayment(
                $liquidation,
                $request->cash_register_session_id,
                auth()->id()
            );

            return redirect()->route('commissions.show', $liquidation)
                ->with('success', 'Pago de liquidación procesado exitosamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => [$e->getMessage()]]);
        }
    }

    /**
     * Cancel the specified commission liquidation.
     */
    public function cancel(CommissionLiquidation $liquidation): RedirectResponse
    {
        try {
            $this->commissionService->cancelLiquidation($liquidation);

            return redirect()->route('commissions.show', $liquidation)
                ->with('success', 'Liquidación cancelada exitosamente.');

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

            return redirect()->route('commissions.index')
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

        return Inertia::render('commissions/Report', [
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

        return Inertia::render('commissions/Pending', [
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
}