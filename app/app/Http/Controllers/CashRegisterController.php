<?php

namespace App\Http\Controllers;

use App\Services\CashRegisterService;
use App\Services\PaymentService;
use App\Models\CashRegisterSession;
use App\Models\Transaction;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CashRegisterController extends Controller
{
    public function __construct(
        private CashRegisterService $cashRegisterService,
        private PaymentService $paymentService
    ) {}

    /**
     * Display the cash register dashboard
     */
    public function index(): Response
    {
        $user = Auth::user();
        $activeSession = $this->cashRegisterService->getActiveSession($user);
        
        // Get today's transactions
        $todayTransactions = collect();
        $balance = [
            'opening' => 0,
            'income' => 0,
            'expense' => 0,
            'current' => 0,
        ];

        if ($activeSession) {
            $todayTransactions = $activeSession->transactions()
                ->whereDate('created_at', today())
                ->with('user', 'service')
                ->latest()
                ->get();
            
            $balance = [
                'opening' => $activeSession->opening_balance,
                'income' => $todayTransactions->where('type', 'INCOME')->sum('amount') + 
                           $todayTransactions->where('type', 'PAYMENT')->sum('amount'),
                'expense' => $todayTransactions->where('type', 'EXPENSE')->sum('amount'),
                'current' => $activeSession->opening_balance + 
                           $todayTransactions->where('type', 'INCOME')->sum('amount') +
                           $todayTransactions->where('type', 'PAYMENT')->sum('amount') -
                           $todayTransactions->where('type', 'EXPENSE')->sum('amount'),
            ];
        }

        return Inertia::render('cash-register/dashboard', [
            'activeSession' => $activeSession,
            'todayTransactions' => $todayTransactions,
            'balance' => $balance,
        ]);
    }

    /**
     * Open a new cash register session
     */
    public function open(Request $request)
    {
        $request->validate([
            'initial_amount' => 'required|numeric|min:0',
        ]);

        try {
            $session = $this->cashRegisterService->openSession(
                Auth::user(),
                $request->initial_amount
            );

            return redirect()->route('cash-register.index')->with('success', 'Caja abierta exitosamente.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Close the active cash register session
     */
    public function close(Request $request)
    {
        $request->validate([
            'final_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $activeSession = $this->cashRegisterService->getActiveSession(Auth::user());
            if (!$activeSession) {
                throw new \Exception('No hay sesión de caja activa.');
            }

            $session = $this->cashRegisterService->closeSession(
                $activeSession,
                $request->final_amount,
                Auth::user(),
                $request->notes
            );

            return redirect()->route('cash-register.index')->with('success', 'Caja cerrada exitosamente.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Process a payment
     */
    public function processPayment(Request $request)
    {
        $request->validate([
            'service_id' => 'required|exists:services,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:CASH,CARD,TRANSFER',
            'patient_name' => 'required|string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $activeSession = $this->cashRegisterService->getActiveSession(Auth::user());
            if (!$activeSession) {
                throw new \Exception('No hay sesión de caja activa.');
            }

            $service = Service::findOrFail($request->service_id);
            
            $payment = $this->paymentService->processServicePayment(
                $activeSession,
                $service,
                $request->amount,
                [
                    'payment_method' => $request->payment_method,
                    'patient_name' => $request->patient_name,
                    'notes' => $request->notes,
                ]
            );

            return redirect()->route('cash-register.index')->with('success', 'Pago procesado exitosamente.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Register an income transaction
     */
    public function registerIncome(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'concept' => 'required|string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $activeSession = $this->cashRegisterService->getActiveSession(Auth::user());
            if (!$activeSession) {
                throw new \Exception('No hay sesión de caja activa.');
            }

            $transaction = Transaction::create([
                'cash_register_session_id' => $activeSession->id,
                'type' => 'INCOME',
                'amount' => $request->amount,
                'concept' => $request->concept,
                'notes' => $request->notes,
                'user_id' => Auth::id(),
                'payment_method' => 'CASH',
            ]);

            return redirect()->route('cash-register.index')->with('success', 'Ingreso registrado exitosamente.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Register an expense transaction
     */
    public function registerExpense(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'concept' => 'required|string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $activeSession = $this->cashRegisterService->getActiveSession(Auth::user());
            if (!$activeSession) {
                throw new \Exception('No hay sesión de caja activa.');
            }

            $transaction = Transaction::create([
                'cash_register_session_id' => $activeSession->id,
                'type' => 'EXPENSE',
                'amount' => $request->amount,
                'concept' => $request->concept,
                'notes' => $request->notes,
                'user_id' => Auth::id(),
                'payment_method' => 'CASH',
            ]);

            return redirect()->route('cash-register.index')->with('success', 'Egreso registrado exitosamente.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Show transaction history
     */
    public function history(Request $request): Response
    {
        $user = Auth::user();
        
        $transactions = Transaction::with(['user', 'service'])
            ->when($request->date_from, function ($query, $date) {
                return $query->whereDate('created_at', '>=', $date);
            })
            ->when($request->date_to, function ($query, $date) {
                return $query->whereDate('created_at', '<=', $date);
            })
            ->when($request->type, function ($query, $type) {
                return $query->where('type', $type);
            })
            ->latest()
            ->paginate(15)
            ->through(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'concept' => $transaction->concept,
                    'amount' => $transaction->amount,
                    'payment_method' => $transaction->payment_method,
                    'patient_name' => $transaction->patient_name,
                    'notes' => $transaction->notes,
                    'user' => [
                        'name' => $transaction->user->name,
                    ],
                    'service' => $transaction->service ? [
                        'name' => $transaction->service->name,
                    ] : null,
                    'created_at' => $transaction->created_at,
                ];
            });

        return Inertia::render('CashRegister/History', [
            'transactions' => $transactions,
            'filters' => $request->only(['date_from', 'date_to', 'type']),
        ]);
    }

    /**
     * Show services management
     */
    public function services(): Response
    {
        $services = Service::active()->orderBy('name')->get();

        return Inertia::render('CashRegister/Services', [
            'services' => $services,
        ]);
    }
}