<?php

namespace App\Services;

use App\Models\CommissionLiquidation;
use App\Models\CommissionLiquidationDetail;
use App\Models\Professional;
use App\Models\ProfessionalCommission;
use App\Models\ServiceRequest;
use App\Models\Transaction;
use App\Models\CashRegisterSession;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

/**
 * CommissionService
 *
 * Handles commission calculation, liquidation generation, and payment processing
 * for medical professionals based on services provided.
 */
class CommissionService
{
    /**
     * Calculate commission for a professional based on service amount and percentage.
     *
     * @param float $serviceAmount
     * @param float $commissionPercentage
     * @return float
     */
    public function calculateCommission(float $serviceAmount, float $commissionPercentage): float
    {
        return round(($serviceAmount * $commissionPercentage) / 100, 2);
    }

    /**
     * Get commission data for a professional within a date range.
     *
     * @param int $professionalId
     * @param string $startDate
     * @param string $endDate
     * @return array
     */
    public function getProfessionalCommissionData(int $professionalId, string $startDate, string $endDate): array
    {
        $professional = Professional::findOrFail($professionalId);

        // Get paid movements for the professional in the date range
        $movements = Transaction::where('professional_id', $professionalId)
            ->where('type', 'INCOME')
            ->where('category', 'SERVICE_PAYMENT')
            ->where('status', 'active')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->with(['serviceRequest', 'patient'])
            ->get();

        $totalGross = 0;
        $totalCommission = 0;
        $services = [];

        foreach ($movements as $movement) {
            $serviceAmount = $movement->amount;
            $commissionAmount = $this->calculateCommission($serviceAmount, $professional->commission_percentage);

            $totalGross += $serviceAmount;
            $totalCommission += $commissionAmount;

            $services[] = [
                'movement_id' => $movement->id,
                'service_request_id' => $movement->service_request_id,
                'patient_id' => $movement->patient_id,
                'service_id' => $movement->service_id ?? null,
                'service_date' => $movement->created_at->format('Y-m-d'),
                'payment_date' => $movement->created_at->format('Y-m-d'),
                'service_amount' => $serviceAmount,
                'commission_percentage' => $professional->commission_percentage,
                'commission_amount' => $commissionAmount,
            ];
        }

        return [
            'professional' => $professional,
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
            'summary' => [
                'total_services' => count($services),
                'gross_amount' => $totalGross,
                'commission_percentage' => $professional->commission_percentage,
                'commission_amount' => $totalCommission,
            ],
            'services' => $services,
        ];
    }

    /**
     * Generate a commission liquidation for a professional.
     *
     * @param int $professionalId
     * @param string $startDate
     * @param string $endDate
     * @param int $generatedBy
     * @return CommissionLiquidation
     * @throws \Exception
     */
    public function generateLiquidation(int $professionalId, string $startDate, string $endDate, int $generatedBy): CommissionLiquidation
    {
        DB::beginTransaction();
        try {
            $commissionData = $this->getProfessionalCommissionData($professionalId, $startDate, $endDate);

            if (empty($commissionData['services'])) {
                throw new \Exception('No hay servicios pagados en el período especificado para generar liquidación.');
            }

            // Create liquidation
            $liquidation = CommissionLiquidation::create([
                'professional_id' => $professionalId,
                'period_start' => $startDate,
                'period_end' => $endDate,
                'total_services' => $commissionData['summary']['total_services'],
                'gross_amount' => $commissionData['summary']['gross_amount'],
                'commission_percentage' => $commissionData['summary']['commission_percentage'],
                'commission_amount' => $commissionData['summary']['commission_amount'],
                'status' => CommissionLiquidation::STATUS_DRAFT,
                'generated_by' => $generatedBy,
            ]);

            // Create liquidation details
            foreach ($commissionData['services'] as $service) {
                CommissionLiquidationDetail::create([
                    'liquidation_id' => $liquidation->id,
                    'service_request_id' => $service['service_request_id'],
                    'patient_id' => $service['patient_id'],
                    'service_id' => $service['service_id'],
                    'service_date' => $service['service_date'],
                    'payment_date' => $service['payment_date'],
                    'service_amount' => $service['service_amount'],
                    'commission_percentage' => $service['commission_percentage'],
                    'commission_amount' => $service['commission_amount'],
                    'payment_movement_id' => $service['movement_id'],
                ]);
            }

            DB::commit();
            return $liquidation->fresh(['details', 'professional', 'generatedBy']);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Approve a commission liquidation.
     *
     * @param CommissionLiquidation $liquidation
     * @param int $approvedBy
     * @return CommissionLiquidation
     * @throws \Exception
     */
    public function approveLiquidation(CommissionLiquidation $liquidation, int $approvedBy): CommissionLiquidation
    {
        if (!$liquidation->isDraft()) {
            throw new \Exception('Solo se pueden aprobar liquidaciones en estado borrador.');
        }

        $liquidation->approve($approvedBy);
        return $liquidation->fresh();
    }

    /**
     * Process payment for an approved commission liquidation.
     *
     * @param CommissionLiquidation $liquidation
     * @param int $cashRegisterSessionId
     * @param int $processedBy
     * @return array
     * @throws \Exception
     */
    public function processPayment(CommissionLiquidation $liquidation, int $cashRegisterSessionId, int $processedBy): array
    {
        if (!$liquidation->isApproved()) {
            throw new \Exception('Solo se pueden pagar liquidaciones aprobadas.');
        }

        DB::beginTransaction();
        try {
            $paymentService = app(PaymentService::class);

            // Create payment movement
            $movement = $paymentService->processCommissionLiquidation(
                CashRegisterSession::findOrFail($cashRegisterSessionId),
                $liquidation->professional_id,
                $liquidation->commission_amount,
                "Liquidación de comisiones - Período: {$liquidation->period_start} a {$liquidation->period_end}",
                $liquidation->id
            );

            // Mark liquidation as paid
            $liquidation->markAsPaid($movement->id);

            DB::commit();

            return [
                'liquidation' => $liquidation->fresh(),
                'movement' => $movement,
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Cancel a commission liquidation.
     *
     * @param CommissionLiquidation $liquidation
     * @return CommissionLiquidation
     * @throws \Exception
     */
    public function cancelLiquidation(CommissionLiquidation $liquidation): CommissionLiquidation
    {
        if ($liquidation->isPaid()) {
            throw new \Exception('No se pueden cancelar liquidaciones que ya han sido pagadas.');
        }

        $liquidation->cancel();
        return $liquidation->fresh();
    }

    /**
     * Get commission report for a professional.
     *
     * @param int $professionalId
     * @param string|null $startDate
     * @param string|null $endDate
     * @return array
     */
    public function getCommissionReport(int $professionalId, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = CommissionLiquidation::with(['professional', 'details'])
            ->forProfessional($professionalId);

        if ($startDate && $endDate) {
            $query->inPeriod($startDate, $endDate);
        }

        $liquidations = $query->orderBy('period_end', 'desc')->get();

        $totalLiquidations = $liquidations->count();
        $totalCommission = $liquidations->sum('commission_amount');
        $paidCommission = $liquidations->where('status', CommissionLiquidation::STATUS_PAID)->sum('commission_amount');
        $pendingCommission = $liquidations->whereIn('status', [CommissionLiquidation::STATUS_DRAFT, CommissionLiquidation::STATUS_APPROVED])->sum('commission_amount');

        return [
            'professional' => Professional::find($professionalId),
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
            'summary' => [
                'total_liquidations' => $totalLiquidations,
                'total_commission' => $totalCommission,
                'paid_commission' => $paidCommission,
                'pending_commission' => $pendingCommission,
            ],
            'liquidations' => $liquidations,
        ];
    }

    /**
     * Get pending liquidations for approval.
     *
     * @return Collection
     */
    public function getPendingLiquidations(): Collection
    {
        return CommissionLiquidation::with(['professional', 'generatedBy'])
            ->where('status', CommissionLiquidation::STATUS_DRAFT)
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Validate liquidation data before generation.
     *
     * @param int $professionalId
     * @param string $startDate
     * @param string $endDate
     * @return array
     */
    public function validateLiquidationData(int $professionalId, string $startDate, string $endDate): array
    {
        $errors = [];

        $professional = Professional::find($professionalId);
        if (!$professional) {
            $errors[] = 'Profesional no encontrado.';
        }

        if (!$professional->commission_percentage || $professional->commission_percentage <= 0) {
            $errors[] = 'El profesional no tiene configurado un porcentaje de comisión válido.';
        }

        if (!strtotime($startDate) || !strtotime($endDate)) {
            $errors[] = 'Fechas de período inválidas.';
        }

        if (strtotime($startDate) > strtotime($endDate)) {
            $errors[] = 'La fecha de inicio no puede ser posterior a la fecha de fin.';
        }

        // Check for overlapping liquidations
        $existingLiquidation = CommissionLiquidation::forProfessional($professionalId)
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('period_start', [$startDate, $endDate])
                      ->orWhereBetween('period_end', [$startDate, $endDate])
                      ->orWhere(function ($q) use ($startDate, $endDate) {
                          $q->where('period_start', '<=', $startDate)
                            ->where('period_end', '>=', $endDate);
                      });
            })
            ->whereNotIn('status', [CommissionLiquidation::STATUS_CANCELLED])
            ->first();

        if ($existingLiquidation) {
            $errors[] = 'Ya existe una liquidación para este período que no ha sido cancelada.';
        }

        return $errors;
    }
}