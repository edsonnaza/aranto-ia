<?php

namespace App\Services;

use App\Models\CashRegisterSession;
use App\Models\Transaction;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CashRegisterService
{
    /**
     * Abrir una nueva sesión de caja
     */
    public function openSession(User $user, float $initialAmount, ?string $notes = null): CashRegisterSession
    {
        // Verificar que el usuario no tenga otra sesión abierta
        $existingSession = CashRegisterSession::where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        if ($existingSession) {
            throw new \Exception('El usuario ya tiene una sesión de caja abierta.');
        }

        DB::beginTransaction();
        try {
            $session = CashRegisterSession::create([
                'user_id' => $user->id,
                'opening_date' => Carbon::now(),
                'initial_amount' => $initialAmount,
                'calculated_balance' => $initialAmount,
                'total_income' => 0.00,
                'total_expenses' => 0.00,
                'status' => 'open',
            ]);

            // Registrar en auditoría
            AuditLog::logActivity(
                $session,
                'opened',
                null,
                $session->toArray(),
                'Sesión de caja abierta' . ($notes ? ": $notes" : '')
            );

            DB::commit();
            return $session;
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Cerrar sesión de caja
     */
    public function closeSession(
        CashRegisterSession $session, 
        float $finalPhysicalAmount, 
        ?User $authorizedBy = null,
        ?string $differenceJustification = null
    ): CashRegisterSession {
        if ($session->status !== 'open') {
            throw new \Exception('La sesión de caja ya está cerrada.');
        }

        DB::beginTransaction();
        try {
            $calculatedBalance = $session->calculateBalance();
            $difference = $finalPhysicalAmount - $calculatedBalance;

            $oldValues = $session->toArray();

            $session->update([
                'closing_date' => Carbon::now(),
                'final_physical_amount' => $finalPhysicalAmount,
                'calculated_balance' => $calculatedBalance,
                'difference' => $difference,
                'status' => 'closed',
                'difference_justification' => $differenceJustification,
                'authorized_by' => $authorizedBy?->id,
            ]);

            // Registrar en auditoría
            AuditLog::logActivity(
                $session,
                'closed',
                $oldValues,
                $session->fresh()->toArray(),
                "Sesión de caja cerrada. Diferencia: $difference"
            );

            DB::commit();
            return $session->fresh();
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Obtener sesión activa del usuario
     */
    public function getActiveSession(User $user): ?CashRegisterSession
    {
        return CashRegisterSession::where('user_id', $user->id)
            ->where('status', 'open')
            ->with(['transactions' => function($query) {
                $query->where('status', 'active')->orderBy('created_at', 'desc');
            }])
            ->first();
    }

    /**
     * Obtener resumen de sesión
     */
    public function getSessionSummary(CashRegisterSession $session): array
    {
        $transactions = $session->transactions()->where('status', 'active')->get();

        $incomeTransactions = $transactions->where('type', 'INCOME');
        // Filtrar egresos para excluir refunds
        $expenseTransactions = $transactions->where('type', 'EXPENSE')->filter(function($tx) {
            return $tx->category !== 'SERVICE_REFUND';
        });
        $refundTransactions = $transactions->where('type', 'EXPENSE')->filter(function($tx) {
            return $tx->category === 'SERVICE_REFUND';
        });

        return [
            'session' => $session,
            'summary' => [
                'initial_amount' => $session->initial_amount,
                'total_income' => $incomeTransactions->sum('amount'),
                'total_expenses' => $expenseTransactions->sum('amount'), // solo egresos reales
                'calculated_balance' => $session->calculateBalance(),
                'transactions_count' => $transactions->count(),
                'income_transactions_count' => $incomeTransactions->count(),
                'expense_transactions_count' => $expenseTransactions->count(),
                'refund_transactions_count' => $refundTransactions->count(),
            ],
            'transactions' => [
                'income' => $incomeTransactions->values(),
                'expenses' => $expenseTransactions->values(),
                'refunds' => $refundTransactions->values(),
                'recent' => $transactions->sortByDesc('created_at')->take(10)->values(),
            ]
        ];
    }

    /**
     * Verificar si hay diferencias significativas en caja
     */
    public function checkDiscrepancies(CashRegisterSession $session, float $threshold = 10.00): array
    {
        if ($session->status !== 'closed' || $session->difference === null) {
            return ['has_discrepancy' => false];
        }

        $hasDiscrepancy = abs($session->difference) > $threshold;

        return [
            'has_discrepancy' => $hasDiscrepancy,
            'difference_amount' => $session->difference,
            'threshold' => $threshold,
            'requires_authorization' => $hasDiscrepancy,
            'status' => $hasDiscrepancy ? 'discrepancy_detected' : 'normal',
        ];
    }

    /**
     * Obtener historial de sesiones del usuario
     */
    public function getUserSessionHistory(User $user, int $limit = 20): array
    {
        $sessions = CashRegisterSession::where('user_id', $user->id)
            ->orderBy('opening_date', 'desc')
            ->limit($limit)
            ->get();

        return [
            'sessions' => $sessions,
            'statistics' => [
                'total_sessions' => $sessions->count(),
                'average_difference' => $sessions->where('status', 'closed')->avg('difference') ?? 0,
                'sessions_with_discrepancies' => $sessions->where('status', 'closed')
                    ->filter(function($session) {
                        return abs($session->difference ?? 0) > 10;
                    })->count(),
            ]
        ];
    }
}