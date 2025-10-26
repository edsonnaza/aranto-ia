<?php

namespace App\Services;

use App\Models\CashRegisterSession;
use App\Models\Transaction;
use App\Models\Service;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PaymentService
{
    /**
     * Procesar cobro de servicio médico
     */
    public function processServicePayment(
        CashRegisterSession $session,
        Service $service,
        float $amount,
        array $paymentDetails = [],
        ?int $patientId = null,
        ?int $professionalId = null,
        ?string $concept = null
    ): Transaction {
        if ($session->status !== 'open') {
            throw new \Exception('No se puede procesar el pago. La sesión de caja está cerrada.');
        }

        DB::beginTransaction();
        try {
            // Crear la transacción
            $transaction = Transaction::create([
                'cash_register_session_id' => $session->id,
                'type' => 'INCOME',
                'category' => 'SERVICE_PAYMENT',
                'amount' => $amount,
                'concept' => $concept ?? "Pago de servicio: {$service->name}",
                'patient_id' => $patientId,
                'professional_id' => $professionalId,
                'user_id' => auth()->id(),
                'status' => 'active',
            ]);

            // Actualizar totales de la sesión
            $this->updateSessionTotals($session);

            // Registrar auditoría
            AuditLog::logActivity(
                $transaction,
                'created',
                null,
                $transaction->toArray(),
                "Cobro de servicio procesado: {$service->name} - Monto: $amount"
            );

            DB::commit();
            return $transaction;
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Procesar pago a proveedor
     */
    public function processSupplierPayment(
        CashRegisterSession $session,
        float $amount,
        string $concept,
        array $paymentDetails = []
    ): Transaction {
        if ($session->status !== 'open') {
            throw new \Exception('No se puede procesar el pago. La sesión de caja está cerrada.');
        }

        DB::beginTransaction();
        try {
            $transaction = Transaction::create([
                'cash_register_session_id' => $session->id,
                'type' => 'EXPENSE',
                'category' => 'SUPPLIER_PAYMENT',
                'amount' => $amount,
                'concept' => $concept,
                'user_id' => auth()->id(),
                'status' => 'active',
            ]);

            // Actualizar totales de la sesión
            $this->updateSessionTotals($session);

            // Registrar auditoría
            AuditLog::logActivity(
                $transaction,
                'created',
                null,
                $transaction->toArray(),
                "Pago a proveedor procesado: $concept - Monto: $amount"
            );

            DB::commit();
            return $transaction;
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Procesar liquidación de comisiones
     */
    public function processCommissionLiquidation(
        CashRegisterSession $session,
        int $professionalId,
        float $amount,
        string $concept,
        ?int $liquidationId = null
    ): Transaction {
        if ($session->status !== 'open') {
            throw new \Exception('No se puede procesar el pago. La sesión de caja está cerrada.');
        }

        DB::beginTransaction();
        try {
            $transaction = Transaction::create([
                'cash_register_session_id' => $session->id,
                'type' => 'EXPENSE',
                'category' => 'COMMISSION_LIQUIDATION',
                'amount' => $amount,
                'concept' => $concept,
                'professional_id' => $professionalId,
                'liquidation_id' => $liquidationId,
                'user_id' => auth()->id(),
                'status' => 'active',
            ]);

            // Actualizar totales de la sesión
            $this->updateSessionTotals($session);

            // Registrar auditoría
            AuditLog::logActivity(
                $transaction,
                'created',
                null,
                $transaction->toArray(),
                "Liquidación de comisión procesada: $concept - Monto: $amount"
            );

            DB::commit();
            return $transaction;
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Cancelar transacción
     */
    public function cancelTransaction(
        Transaction $transaction,
        string $reason,
        User $cancelledBy
    ): Transaction {
        if ($transaction->status !== 'active') {
            throw new \Exception('La transacción ya está cancelada o no puede ser cancelada.');
        }

        if ($transaction->cashRegisterSession->status !== 'open') {
            throw new \Exception('No se puede cancelar la transacción. La sesión de caja está cerrada.');
        }

        DB::beginTransaction();
        try {
            $oldValues = $transaction->toArray();

            // Crear transacción de reverso
            $reverseTransaction = Transaction::create([
                'cash_register_session_id' => $transaction->cash_register_session_id,
                'type' => $transaction->type === 'INCOME' ? 'EXPENSE' : 'INCOME',
                'category' => 'CASH_DIFFERENCE',
                'amount' => $transaction->amount,
                'concept' => "Cancelación: {$transaction->concept}",
                'original_transaction_id' => $transaction->id,
                'user_id' => $cancelledBy->id,
                'status' => 'active',
            ]);

            // Marcar la transacción original como cancelada
            $transaction->update([
                'status' => 'cancelled',
                'cancellation_reason' => $reason,
                'cancelled_by' => $cancelledBy->id,
                'cancelled_at' => Carbon::now(),
            ]);

            // Actualizar totales de la sesión
            $this->updateSessionTotals($transaction->cashRegisterSession);

            // Registrar auditoría
            AuditLog::logActivity(
                $transaction,
                'cancelled',
                $oldValues,
                $transaction->fresh()->toArray(),
                "Transacción cancelada: $reason"
            );

            DB::commit();
            return $transaction->fresh();
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Calcular comisión de profesional para un servicio
     */
    public function calculateProfessionalCommission(Service $service, float $amount): float
    {
        return $amount * ($service->professional_commission_percentage / 100);
    }

    /**
     * Obtener métodos de pago disponibles
     */
    public function getAvailablePaymentMethods(): array
    {
        return [
            'CASH' => 'Efectivo',
            'CREDIT_CARD' => 'Tarjeta de Crédito',
            'DEBIT_CARD' => 'Tarjeta de Débito',
            'TRANSFER' => 'Transferencia',
            'CHECK' => 'Cheque',
        ];
    }

    /**
     * Validar datos de pago
     */
    public function validatePaymentData(array $paymentData): array
    {
        $errors = [];

        if (!isset($paymentData['amount']) || $paymentData['amount'] <= 0) {
            $errors[] = 'El monto debe ser mayor a cero';
        }

        if (!isset($paymentData['concept']) || empty(trim($paymentData['concept']))) {
            $errors[] = 'El concepto es requerido';
        }

        if (isset($paymentData['payment_method'])) {
            $validMethods = array_keys($this->getAvailablePaymentMethods());
            if (!in_array($paymentData['payment_method'], $validMethods)) {
                $errors[] = 'Método de pago no válido';
            }
        }

        return $errors;
    }

    /**
     * Actualizar totales de la sesión de caja
     */
    private function updateSessionTotals(CashRegisterSession $session): void
    {
        $activeTransactions = $session->transactions()->where('status', 'active')->get();
        
        $totalIncome = $activeTransactions->where('type', 'INCOME')->sum('amount');
        $totalExpenses = $activeTransactions->where('type', 'EXPENSE')->sum('amount');
        $calculatedBalance = $session->initial_amount + $totalIncome - $totalExpenses;

        $session->update([
            'total_income' => $totalIncome,
            'total_expenses' => $totalExpenses,
            'calculated_balance' => $calculatedBalance,
        ]);
    }

    /**
     * Generar reporte de transacciones por período
     */
    public function getTransactionReport(
        Carbon $startDate,
        Carbon $endDate,
        ?array $filters = []
    ): array {
        $query = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'active');

        // Aplicar filtros
        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        $transactions = $query->with(['cashRegisterSession.user'])->get();

        return [
            'transactions' => $transactions,
            'summary' => [
                'total_transactions' => $transactions->count(),
                'total_income' => $transactions->where('type', 'INCOME')->sum('amount'),
                'total_expenses' => $transactions->where('type', 'EXPENSE')->sum('amount'),
                'net_amount' => $transactions->where('type', 'INCOME')->sum('amount') - 
                              $transactions->where('type', 'EXPENSE')->sum('amount'),
            ],
            'period' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ]
        ];
    }

    /**
     * Anular una transacción
     */
    public function voidTransaction(
        Transaction $transaction,
        string $reason,
        User $authorizedBy
    ): Transaction {
        if ($transaction->status === 'voided') {
            throw new \Exception('La transacción ya está anulada.');
        }

        // Verificar que la sesión esté cerrada
        $session = $transaction->cashRegisterSession;
        if ($session->status !== 'closed') {
            throw new \Exception('Solo se pueden anular transacciones de sesiones cerradas.');
        }

        DB::beginTransaction();
        try {
            $oldValues = $transaction->toArray();

            // Actualizar el status de la transacción
            $transaction->update([
                'status' => 'voided',
                'void_reason' => $reason,
                'voided_by' => $authorizedBy->id,
                'voided_at' => Carbon::now()
            ]);

            // Registrar auditoría
            AuditLog::logActivity(
                $transaction,
                'voided',
                $oldValues,
                $transaction->fresh()->toArray(),
                "Transacción anulada por {$authorizedBy->name}: {$reason}"
            );

            DB::commit();
            return $transaction->fresh();
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}