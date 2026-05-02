<?php

namespace App\Http\Controllers;

use App\Models\CashRegisterSession;
use App\Models\Transaction;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Carbon;

class TreasuryController extends Controller
{
    public function index(): Response
    {
        $today = Carbon::today();

        $openSessions        = $this->getOpenSessions();
        $todayStats          = $this->getTodayStats($today);
        $recentTransactions  = $this->getRecentTransactions($today);
        $closingHistory      = $this->getClosingHistory();
        $lastClosingBalance  = $this->getLastClosingBalance();
        $globalTreasuryBalance = $this->getGlobalTreasuryBalance();

        $closedToday = CashRegisterSession::whereDate('closing_date', $today)
            ->where('status', 'closed')
            ->count();

        $allTimeIncome  = Transaction::where('status', 'active')->where('type', 'INCOME')->sum('amount');
        $allTimeExpense = Transaction::where('status', 'active')->where('type', 'EXPENSE')->sum('amount');

        return Inertia::render('financial/treasury/Index', [
            'stats' => [
                'total_open_balance'      => $openSessions->sum('current_balance'),
                'global_treasury_balance' => $globalTreasuryBalance,
                'today_income'            => $todayStats['income'],
                'today_expense'           => $todayStats['expense'],
                'all_time_income'         => $allTimeIncome,
                'all_time_expense'        => $allTimeExpense,
                'open_sessions_count'     => $openSessions->count(),
                'closed_today_count'      => $closedToday,
                'last_closing_balance'    => $lastClosingBalance ? $lastClosingBalance['calculated_balance'] : null,
                'last_closing_date'       => $lastClosingBalance ? $lastClosingBalance['closing_date'] : null,
                'last_closing_user'       => $lastClosingBalance ? $lastClosingBalance['user_name'] : null,
            ],
            'open_sessions'       => $openSessions,
            'recent_transactions' => $recentTransactions,
            'closing_history'     => $closingHistory,
        ]);
    }

    private function getOpenSessions(): Collection
    {
        return CashRegisterSession::with('user')
            ->where('status', 'open')
            ->orderBy('opening_date', 'desc')
            ->get()
            ->map(function (CashRegisterSession $session) {
                $transactions  = Transaction::where('cash_register_session_id', $session->id)
                    ->where('status', 'active')->get();
                $totalIncome   = $transactions->where('type', 'INCOME')->sum('amount');
                $totalExpenses = $transactions->where('type', 'EXPENSE')->sum('amount');

                return [
                    'id'               => $session->id,
                    'user_name'        => $session->user?->name ?? 'Sin usuario',
                    'opening_date'     => $session->opening_date,
                    'initial_amount'   => $session->initial_amount,
                    'current_balance'  => $session->initial_amount + $totalIncome - $totalExpenses,
                    'total_income'     => $totalIncome,
                    'total_expenses'   => $totalExpenses,
                    'transaction_count' =>
                        $transactions->whereNotNull('service_request_id')->pluck('service_request_id')->unique()->count()
                        + $transactions->whereNull('service_request_id')->count(),
                ];
            });
    }

    /** @return array{income: float, expense: float} */
    private function getTodayStats(Carbon $today): array
    {
        $txs = Transaction::where('status', 'active')->whereDate('created_at', $today)->get(['type', 'amount']);
        return [
            'income'  => $txs->where('type', 'INCOME')->sum('amount'),
            'expense' => $txs->where('type', 'EXPENSE')->sum('amount'),
        ];
    }

    private function getRecentTransactions(Carbon $today): Collection
    {
        return Transaction::with('cashRegisterSession.user')
            ->where('status', 'active')
            ->whereDate('created_at', $today)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(fn (Transaction $t) => [
                'id'                 => $t->id,
                'type'               => $t->type,
                'amount'             => $t->amount,
                'concept'            => $t->concept,
                'payment_method'     => $t->payment_method,
                'created_at'         => $t->created_at,
                'user_name'          => $t->cashRegisterSession?->user?->name ?? '—',
                'service_request_id' => $t->service_request_id,
            ]);
    }

    private function getLastClosingBalance(): ?array
    {
        $session = CashRegisterSession::with('user')
            ->where('status', 'closed')
            ->orderBy('closing_date', 'desc')
            ->first();

        if (!$session) {
            return null;
        }

        return [
            'user_name'          => $session->user?->name ?? '—',
            'closing_date'       => $session->closing_date,
            'calculated_balance' => $session->calculateBalance(),
        ];
    }

    private function getClosingHistory(): Collection
    {
        return CashRegisterSession::with('user')
            ->where('status', 'closed')
            ->orderBy('closing_date', 'desc')
            ->limit(25)
            ->get()
            ->map(function (CashRegisterSession $s) {
                $transactions      = Transaction::where('cash_register_session_id', $s->id)
                    ->where('status', 'active')->get();
                $totalIncome   = $transactions->where('type', 'INCOME')->sum('amount');
                $totalExpenses = $transactions->where('type', 'EXPENSE')
                    ->filter(fn (Transaction $tx) => $tx->category !== 'SERVICE_REFUND')
                    ->sum('amount');
                $byMethod = $transactions->groupBy('payment_method')
                    ->map(fn (Collection $txs) => [
                        'income'  => $txs->where('type', 'INCOME')->sum('amount'),
                        'expense' => $txs->where('type', 'EXPENSE')->sum('amount'),
                        'net'     => $txs->where('type', 'INCOME')->sum('amount') - $txs->where('type', 'EXPENSE')->sum('amount'),
                    ]);

                return [
                    'id'                 => $s->id,
                    'user_name'          => $s->user?->name ?? '—',
                    'opening_date'       => $s->opening_date,
                    'closing_date'       => $s->closing_date,
                    'initial_amount'     => $s->initial_amount,
                    'calculated_balance' => $s->initial_amount + $totalIncome - $totalExpenses,
                    'total_income'       => $totalIncome,
                    'total_expenses'     => $totalExpenses,
                    'by_payment_method'  => $byMethod,
                ];
            });
    }

    private function getGlobalTreasuryBalance(): float
    {
        return (float) CashRegisterSession::where('status', 'closed')
            ->orderBy('closing_date', 'desc')
            ->get(['id', 'user_id', 'initial_amount'])
            ->unique('user_id')
            ->sum(fn (CashRegisterSession $s) => $s->calculateBalance());
    }
}

