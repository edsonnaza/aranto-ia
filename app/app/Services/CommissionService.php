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
        // Excluir transacciones que ya tienen commission_liquidation_id
        $movements = Transaction::where('professional_id', $professionalId)
            ->where('type', 'INCOME')
            ->where('category', 'SERVICE_PAYMENT')
            ->where('status', 'active')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('service_request_id')
            ->whereNull('commission_liquidation_id') // Solo transacciones no liquidadas
            ->with(['serviceRequest.patient', 'serviceRequest.details.medicalService'])
            ->get();

        $totalGross = 0;
        $totalCommission = 0;
        $services = [];

        foreach ($movements as $movement) {
            $serviceAmount = $movement->amount;
            $commissionAmount = $this->calculateCommission($serviceAmount, $professional->commission_percentage);

            $totalGross += $serviceAmount;
            $totalCommission += $commissionAmount;

            // Get patient name
            $patientName = $movement->serviceRequest?->patient?->full_name ?? 'Paciente no encontrado';
            
            // Get service name from service_request_details
            $serviceDetail = $movement->serviceRequest?->details?->first();
            $serviceName = $serviceDetail?->medicalService?->name ?? 'Servicio no especificado';

            $services[] = [
                'movement_id' => $movement->id,
                'service_request_id' => $movement->service_request_id,
                'patient_id' => $movement->serviceRequest?->patient_id,
                'patient_name' => $patientName,
                'service_id' => $serviceDetail?->medical_service_id ?? null,
                'service_name' => $serviceName,
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
    public function generateLiquidation(int $professionalId, string $startDate, string $endDate, int $generatedBy, ?array $serviceRequestIds = null): CommissionLiquidation
    {
        DB::beginTransaction();
        try {
            $commissionData = $this->getProfessionalCommissionData($professionalId, $startDate, $endDate);

            // Filtrar servicios si se especifican IDs
            if ($serviceRequestIds !== null) {
                $commissionData['services'] = array_filter(
                    $commissionData['services'],
                    fn($s) => in_array($s['service_request_id'], $serviceRequestIds)
                );
                // Recalcular resumen
                $commissionData['summary']['total_services'] = count($commissionData['services']);
                $commissionData['summary']['gross_amount'] = array_sum(array_column($commissionData['services'], 'service_amount'));
                $commissionData['summary']['commission_amount'] = array_sum(array_column($commissionData['services'], 'commission_amount'));
            }

            if (empty($commissionData['services'])) {
                throw new \Exception('No hay servicios seleccionados para generar liquidación.');
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
                    'service_id' => $service['service_id'] ?? null,
                    'service_date' => $service['service_date'],
                    'payment_date' => $service['payment_date'],
                    'service_amount' => $service['service_amount'],
                    'commission_percentage' => $service['commission_percentage'],
                    'commission_amount' => $service['commission_amount'],
                    'payment_movement_id' => $service['movement_id'],
                ]);

                // Marcar la transacción original como liquidada
                Transaction::where('id', $service['movement_id'])
                    ->update(['commission_liquidation_id' => $liquidation->id]);
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
     * Revert payment for a paid commission liquidation.
     * Only cashier manager can do this operation.
     *
     * @param CommissionLiquidation $liquidation
     * @param int $revertedBy
     * @param string $reason
     * @return CommissionLiquidation
     * @throws \Exception
     */
    public function revertPayment(CommissionLiquidation $liquidation, int $revertedBy, string $reason): CommissionLiquidation
    {
        if (!$liquidation->isPaid()) {
            throw new \Exception('Solo se pueden revertir liquidaciones pagadas.');
        }

        DB::beginTransaction();
        try {
            // Obtener el movimiento de pago original
            $originalMovement = Transaction::findOrFail($liquidation->payment_movement_id);

            // Validar que el movimiento no esté cancelado
            if ($originalMovement->status === 'cancelled') {
                throw new \Exception('El pago ya fue revertido anteriormente.');
            }

            // Cancelar el movimiento de pago usando PaymentService
            $paymentService = app(PaymentService::class);
            $paymentService->cancelTransaction($originalMovement, $revertedBy, $reason);

            // Volver estado a APPROVED
            $liquidation->update([
                'status' => CommissionLiquidation::STATUS_APPROVED,
                'payment_movement_id' => null,
            ]);

            DB::commit();
            return $liquidation->fresh();

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
            throw new \Exception('No se pueden cancelar liquidaciones que ya han sido pagadas. Debe revertir el pago primero desde caja.');
        }

        if ($liquidation->isCancelled()) {
            throw new \Exception('Esta liquidación ya está cancelada.');
        }

        DB::beginTransaction();
        try {
            // Limpiar commission_liquidation_id de las transacciones originales
            Transaction::where('commission_liquidation_id', $liquidation->id)
                ->update(['commission_liquidation_id' => null]);

            // Marcar liquidación como cancelada
            $liquidation->cancel();
            $liquidation->refresh();
            
            DB::commit();
            return $liquidation;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
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
    /**
     * Get service request IDs that are already in a liquidation (not cancelled)
     *
     * @param array $serviceRequestIds
     * @return array
     */
    public function getAlreadyLiquidatedServices(array $serviceRequestIds): array
    {
        return \App\Models\CommissionLiquidationDetail::whereIn('service_request_id', $serviceRequestIds)
            ->whereHas('liquidation', function($query) {
                $query->whereNotIn('status', [CommissionLiquidation::STATUS_CANCELLED]);
            })
            ->pluck('service_request_id')
            ->toArray();
    }
}