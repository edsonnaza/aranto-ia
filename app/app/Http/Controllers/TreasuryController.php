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
                $transactions = $session->transactions()->where('status', 'active')->get();
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
                    'transaction_count' => $transactions->count(),
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
            ->limit(10)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'type' => $t->type,
                'amount' => $t->amount,
                'concept' => $t->concept,
                'payment_method' => $t->payment_method,
                'created_at' => $t->created_at,
                'user_name' => $t->cashRegisterSession?->user?->name ?? '—',
            ]);

        // Resumen de cajas cerradas hoy
        $closedToday = CashRegisterSession::whereDate('closing_date', $today)
            ->where('status', 'closed')
            ->count();

        // Saldo total de cajas abiertas
        $totalOpenBalance = $openSessions->sum('current_balance');

        return Inertia::render('financial/treasury/Index', [
            'stats' => [
                'total_open_balance' => $totalOpenBalance,
                'today_income' => $todayIncome,
                'today_expense' => $todayExpense,
                'open_sessions_count' => $openSessions->count(),
                'closed_today_count' => $closedToday,
            ],
            'open_sessions' => $openSessions,
            'recent_transactions' => $recentTransactions,
        ]);
    }
}
