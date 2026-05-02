<?php

namespace App\Http\Controllers;

use App\Models\CashRegisterSession;
use App\Models\Transaction;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Carbon;

class TreasuryController extends Controller
{
    /**
     * Display the treasury index page
     */
    public function index(): Response
    {
        $today = Carbon::today();

        // Cajas abiertas actualmente
        $openSessions = CashRegisterSession::with('user')
            ->where('status', 'open')
            ->orderBy('opening_date', 'desc')
            ->get()
            ->map(function ($session) {
                $transactions = Transaction::where('cash_register_session_id', $session->id)
                    ->where('status', 'active')
                    ->get();
                $totalIncome = $transactions->where('type', 'INCOME')->sum('amount');
                $totalExpenses = $transactions->where('type', 'EXPENSE')->sum('amount');
                $currentBalance = $session->initial_amount + $totalIncome - $totalExpenses;

                return [
                    'id' => $session->id,
                    'user_name' => $session->user?->name ?? 'Sin usuario',
                    'opening_date' => $session->opening_date,
                    'initial_amount' => $session->initial_amount,
                    'current_balance' => $currentBalance,
                    'total_income' => $totalIncome,
                    'total_expenses' => $totalExpenses,
                    // Cobros agrupados: service_requests únicos + transacciones sin service_request
                    'transaction_count' =>
                        $transactions->whereNotNull('service_request_id')->pluck('service_request_id')->unique()->count()
                        + $transactions->whereNull('service_request_id')->count(),
                ];
            });

        // Resumen del día
        $todayTransactions = Transaction::where('status', 'active')
            ->whereDate('created_at', $today)
            ->get();

        $todayIncome = $todayTransactions->where('type', 'INCOME')->sum('amount');
        $todayExpense = $todayTransactions->where('type', 'EXPENSE')->sum('amount');

        // Últimas 10 transacciones del día
        $recentTransactions = Transaction::with('cashRegisterSession.user')
            ->where('status', 'active')
            ->whereDate('created_at', $today)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(fn($t) => [
                'id'                 => $t->id,
                'type'               => $t->type,
                'amount'             => $t->amount,
                'concept'            => $t->concept,
                'payment_method'     => $t->payment_method,
                'created_at'         => $t->created_at,
                'user_name'          => $t->cashRegisterSession?->user?->name ?? '—',
                'service_request_id' => $t->service_request_id,
            ]);

        // Resumen de cajas cerradas hoy
        $closedToday = CashRegisterSession::whereDate('closing_date', $today)
            ->where('status', 'closed')
            ->count();

        // Saldo total de cajas abiertas
        $totalOpenBalance = $openSessions->sum('current_balance');

        // Última sesión cerrada (cualquier usuario) → para mostrar "último cierre"
        $lastClosedSession = CashRegisterSession::with('user')
            ->where('status', 'closed')
            ->orderBy('closing_date', 'desc')
            ->first();

        $lastClosingBalance = null;
        if ($lastClosedSession) {
            $lastClosingBalance = [
                'user_name'      => $lastClosedSession->user?->name ?? '—',
                'closing_date'   => $lastClosedSession->closing_date,
                'calculated_balance' => $lastClosedSession->calculateBalance(),
                'final_physical_amount' => $lastClosedSession->final_physical_amount,
            ];
        }

        // Historial de cierres (últimas 25 sesiones cerradas)
        $closingHistory = CashRegisterSession::with('user')
            ->where('status', 'closed')
            ->orderBy('closing_date', 'desc')
            ->limit(25)
            ->get()
            ->map(function ($s) {
                $transactions = Transaction::where('cash_register_session_id', $s->id)
                    ->where('status', 'active')
                    ->get();
                $incomeTransactions = $transactions->where('type', 'INCOME');
                $expenseTransactions = $transactions->where('type', 'EXPENSE')
                    ->filter(fn($tx) => $tx->category !== 'SERVICE_REFUND');
                $totalIncome   = $incomeTransactions->sum('amount');
                $totalExpenses = $expenseTransactions->sum('amount');
                // Recalcular siempre desde transacciones para evitar datos obsoletos en DB
                $realCalculatedBalance = $s->initial_amount + $totalIncome - $totalExpenses;

                $byMethod = $transactions->groupBy('payment_method')->map(function ($txs) {
                    return [
                        'income'   => $txs->where('type', 'INCOME')->sum('amount'),
                        'expense'  => $txs->where('type', 'EXPENSE')->sum('amount'),
                        'net'      => $txs->where('type', 'INCOME')->sum('amount') - $txs->where('type', 'EXPENSE')->sum('amount'),
                    ];
                });
                return [
                    'id'                 => $s->id,
                    'user_name'          => $s->user?->name ?? '—',
                    'opening_date'       => $s->opening_date,
                    'closing_date'       => $s->closing_date,
                    'initial_amount'     => $s->initial_amount,
                    'calculated_balance' => $realCalculatedBalance,
                    'total_income'       => $totalIncome,
                    'total_expenses'     => $totalExpenses,
                    'by_payment_method'  => $byMethod,
                ];
            });

        // Saldo global de tesorería = suma del balance real del último cierre por cajero
        // Se recalcula desde transacciones para evitar valores obsoletos en la columna DB
        $globalTreasuryBalance = CashRegisterSession::where('status', 'closed')
            ->orderBy('closing_date', 'desc')
            ->get(['id', 'user_id', 'initial_amount', 'closing_date'])
            ->unique('user_id')
            ->sum(function (CashRegisterSession $s) {
                return $s->calculateBalance();
            });

        // Totales acumulados históricos
        $allTimeIncome  = Transaction::where('status', 'active')->where('type', 'INCOME')->sum('amount');
        $allTimeExpense = Transaction::where('status', 'active')->where('type', 'EXPENSE')->sum('amount');

        return Inertia::render('financial/treasury/Index', [
            'stats' => [
                'total_open_balance'      => $totalOpenBalance,
                'global_treasury_balance' => $globalTreasuryBalance,
                'today_income'            => $todayIncome,
                'today_expense'           => $todayExpense,
                'all_time_income'         => $allTimeIncome,
                'all_time_expense'        => $allTimeExpense,
                'open_sessions_count'     => $openSessions->count(),
                'closed_today_count'      => $closedToday,
                'last_closing_balance'    => $lastClosingBalance ? $lastClosingBalance['calculated_balance'] : null,
                'last_closing_date'       => $lastClosingBalance ? $lastClosingBalance['closing_date'] : null,
                'last_closing_user'       => $lastClosingBalance ? $lastClosingBalance['user_name'] : null,
            ],
            'open_sessions'    => $openSessions,
            'recent_transactions' => $recentTransactions,
            'closing_history'  => $closingHistory,
        ]);
    }
}
