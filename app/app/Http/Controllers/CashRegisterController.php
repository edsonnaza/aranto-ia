<?php

namespace App\Http\Controllers;

use App\Services\CashRegisterService;
use App\Services\PaymentService;
use App\Services\AuditService;
use App\Models\CashRegisterSession;
use App\Models\Transaction;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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
        \Log::info('🔧 DEBUG: CashRegister index method called');
        
        $user = Auth::user();
        \Log::info('🔧 DEBUG: User retrieved', ['user_id' => $user?->id]);
        
        $activeSession = $this->cashRegisterService->getActiveSession($user);
        \Log::info('🔧 DEBUG: Active session retrieved', ['session' => $activeSession?->toArray()]);
        
        // Get today's transactions
        $todayTransactions = collect();
        $balance = [
            'opening' => 0.0,
            'income' => 0.0,
            'expense' => 0.0,
            'current' => 0.0,
        ];

        if ($activeSession) {
            \Log::info('🔧 DEBUG: Processing active session', [
                'session_id' => $activeSession->id,
                'initial_amount' => $activeSession->initial_amount,
                'status' => $activeSession->status
            ]);
            
            $todayTransactions = $activeSession->transactions()
                ->whereDate('created_at', today())
                ->with('user', 'service')
                ->latest()
                ->get();
            
            \Log::info('🔧 DEBUG: Transactions retrieved', ['count' => $todayTransactions->count()]);
            
            $balance = [
                'opening' => $activeSession->initial_amount,
                'income' => $todayTransactions->where('type', 'INCOME')->sum('amount') + 
                           $todayTransactions->where('type', 'PAYMENT')->sum('amount'),
                'expense' => $todayTransactions->where('type', 'EXPENSE')->sum('amount'),
                'current' => $activeSession->initial_amount + 
                           $todayTransactions->where('type', 'INCOME')->sum('amount') +
                           $todayTransactions->where('type', 'PAYMENT')->sum('amount') -
                           $todayTransactions->where('type', 'EXPENSE')->sum('amount'),
            ];
            
            \Log::info('🔧 DEBUG: Balance calculated', $balance);
        }

        return Inertia::render('cash-register/dashboard', [
            'activeSession' => $activeSession,
            'todayTransactions' => $todayTransactions->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'amount' => (float) $transaction->amount,
                    'description' => $transaction->concept ?? '',
                    'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
                    'user' => $transaction->user ? [
                        'name' => $transaction->user->name,
                    ] : null,
                    'service' => $transaction->service ? [
                        'name' => $transaction->service->name,
                    ] : null,
                ];
            }),
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
        Log::info('🔧 DEBUG: Close cash method called');
        Log::info('🔧 DEBUG: Request data:', $request->all());
        Log::info('🔧 DEBUG: User ID:', ['user_id' => auth()->id()]);

        $session = CashRegisterSession::where('user_id', auth()->id())
            ->whereNull('closing_date')  // Cambio de closed_at a closing_date
            ->first();

        Log::info('🔧 DEBUG: Found session:', ['session_id' => $session?->id, 'exists' => !!$session]);

        if (!$session) {
            Log::warning('🔧 DEBUG: No active session found');
            return response()->json(['error' => 'No hay una sesión de caja abierta'], 422);
        }

        $validated = $request->validate([
            'physical_amount' => 'required|numeric|min:0',
            'calculated_balance' => 'required|numeric',
            'difference' => 'required|numeric',
            'notes' => 'nullable|string|max:500',
        ]);

        Log::info('🔧 DEBUG: Validation passed:', $validated);

        try {
            $updated = $session->update([
                'closing_date' => now(),  // Cambio de closed_at a closing_date
                'final_physical_amount' => $validated['physical_amount'],  // Cambio de closing_amount a final_physical_amount
                'calculated_balance' => $validated['calculated_balance'],
                'difference' => $validated['difference'],
                'difference_justification' => $validated['notes'],  // Cambio de closing_notes a difference_justification
                'status' => 'closed',  // Agregar cambio de status
            ]);

            Log::info('🔧 DEBUG: Update result:', ['updated' => $updated]);
            Log::info('🔧 DEBUG: Session after update:', $session->fresh()->toArray());

            // Log audit
            app(AuditService::class)->logActivity(
                $session,
                'cash_register_closed',
                null,
                [
                    'session_id' => $session->id,
                    'closing_amount' => $validated['physical_amount'],
                    'calculated_balance' => $validated['calculated_balance'],
                    'difference' => $validated['difference'],
                ],
                'Caja cerrada exitosamente'
            );

            Log::info('🔧 DEBUG: Audit logged successfully');

            // Redirect back to dashboard with success message
            return redirect()->route('cash-register.index')->with('success', 'Caja cerrada exitosamente');

        } catch (\Exception $e) {
            Log::error('🔧 DEBUG: Exception caught:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->with('error', 'Error al cerrar la caja: ' . $e->getMessage());
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
            'description' => 'required|string|max:255',
            'service_id' => 'nullable|integer|exists:services,id',
            'patient_name' => 'nullable|string|max:255',
        ]);

        try {
            $activeSession = $this->cashRegisterService->getActiveSession(Auth::user());
            if (!$activeSession) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay sesión de caja activa.'
                ], 400);
            }

            $transaction = Transaction::create([
                'cash_register_session_id' => $activeSession->id,
                'type' => 'INCOME',
                'category' => 'SERVICE_PAYMENT', // Default category for income
                'amount' => $request->amount,
                'concept' => $request->description, // Map description to concept
                'patient_id' => $request->service_id, // Temporary mapping
                'user_id' => Auth::id(),
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
            'description' => 'required|string|max:255',
            'service_id' => 'nullable|integer|exists:services,id',
            'patient_name' => 'nullable|string|max:255',
        ]);

        try {
            $activeSession = $this->cashRegisterService->getActiveSession(Auth::user());
            if (!$activeSession) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay sesión de caja activa.'
                ], 400);
            }

            $transaction = Transaction::create([
                'cash_register_session_id' => $activeSession->id,
                'type' => 'EXPENSE',
                'category' => 'OTHER', // Default category for expense
                'amount' => $request->amount,
                'concept' => $request->description, // Map description to concept
                'patient_id' => $request->service_id, // Temporary mapping
                'user_id' => Auth::id(),
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

    /**
     * Show pending services for payment
     */
    public function pendingServices(Request $request): Response
    {
        $query = \App\Models\ServiceRequest::with([
            'patient',
            'details.medicalService',
            'details.insuranceType',
            'details.professional'
        ]);

        // Filter by payment status
        if ($request->status && $request->status !== 'all') {
            if ($request->status === 'pending') {
                $query->where('payment_status', \App\Models\ServiceRequest::PAYMENT_PENDING);
            } elseif ($request->status === 'paid') {
                $query->where('payment_status', \App\Models\ServiceRequest::PAYMENT_PAID);
            }
        } else {
            // Default: only pending unless 'all' is explicitly selected
            if (!$request->status || $request->status !== 'all') {
                $query->where('payment_status', \App\Models\ServiceRequest::PAYMENT_PENDING);
            }
        }

        // Filter by date range
        if ($request->date_from) {
            $query->whereDate('request_date', '>=', $request->date_from);
        }
        
        if ($request->date_to) {
            $query->whereDate('request_date', '<=', $request->date_to);
        }

        // Filter by patient search
        if ($request->search) {
            $query->whereHas('patient', function ($q) use ($request) {
                $q->where('first_name', 'like', '%' . $request->search . '%')
                  ->orWhere('last_name', 'like', '%' . $request->search . '%')
                  ->orWhere('document_number', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by professional
        if ($request->professional_id && $request->professional_id !== 'all') {
            $query->whereHas('details', function ($q) use ($request) {
                $q->where('professional_id', $request->professional_id);
            });
        }

        $serviceRequests = $query
            ->orderBy('request_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Transform data for frontend
        $serviceRequests->getCollection()->transform(function ($request) {
            return [
                'id' => $request->id,
                'request_number' => $request->request_number,
                'patient_name' => $request->patient->full_name,
                'patient_document' => $request->patient->formatted_document,
                'patient_id' => $request->patient->id,
                'request_date' => $request->request_date->format('Y-m-d'),
                'request_time' => $request->request_time,
                'status' => $request->status,
                'payment_status' => $request->payment_status,
                'reception_type' => $request->reception_type,
                'priority' => $request->priority,
                'total_amount' => $request->total_amount,
                'services' => $request->details->map(function ($detail) {
                    return [
                        'id' => $detail->id,
                        'service_name' => $detail->medicalService->name,
                        'service_code' => $detail->medicalService->code,
                        'professional_name' => $detail->professional ? $detail->professional->full_name : 'No asignado',
                        'insurance_type' => $detail->insuranceType->name,
                        'quantity' => $detail->quantity,
                        'unit_price' => $detail->unit_price,
                        'total_price' => $detail->quantity * $detail->unit_price,
                    ];
                })->toArray(),
                'created_at' => $request->created_at->format('Y-m-d H:i'),
            ];
        });

        // Get professionals for filter dropdown
        $professionals = \App\Models\Professional::where('status', 'active')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name']);

        return Inertia::render('CashRegister/PendingServices', [
            'serviceRequests' => $serviceRequests,
            'professionals' => $professionals,
            'filters' => $request->only(['status', 'date_from', 'date_to', 'search', 'professional_id']),
            'summary' => [
                'pending_count' => \App\Models\ServiceRequest::where('payment_status', \App\Models\ServiceRequest::PAYMENT_PENDING)->count(),
                'pending_total' => \App\Models\ServiceRequest::where('payment_status', \App\Models\ServiceRequest::PAYMENT_PENDING)->sum('total_amount'),
            ]
        ]);
    }

    /**
     * Process service payment
     */
    public function processServicePayment(Request $request)
    {
        $request->validate([
            'service_request_id' => 'required|exists:service_requests,id',
            'payment_method' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:255',
        ]);

        try {
            $serviceRequest = \App\Models\ServiceRequest::findOrFail($request->service_request_id);
            
            // Verify service is pending payment
            if ($serviceRequest->payment_status !== \App\Models\ServiceRequest::PAYMENT_PENDING) {
                return response()->json([
                    'success' => false,
                    'message' => 'Este servicio ya ha sido procesado.'
                ], 422);
            }

            // Get active cash register session
            $activeSession = $this->cashRegisterService->getActiveSession(Auth::user());
            if (!$activeSession) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay una sesión de caja activa. Abra la caja primero.'
                ], 422);
            }

            // Determine category based on service origin
            $category = match($serviceRequest->reception_type) {
                'RECEPTION_SCHEDULED', 'RECEPTION_WALK_IN' => 'SERVICE_PAYMENT',
                'INPATIENT_DISCHARGE' => 'INPATIENT_DISCHARGE_PAYMENT',
                'EMERGENCY' => 'EMERGENCY_DISCHARGE_PAYMENT',
                default => 'SERVICE_PAYMENT'
            };

            // Create income transaction
            $transaction = Transaction::create([
                'cash_register_session_id' => $activeSession->id,
                'type' => 'INCOME',
                'category' => $category,
                'amount' => $request->amount,
                'concept' => "Cobro: {$serviceRequest->request_number} - {$serviceRequest->patient->full_name}",
                'payment_method' => $request->payment_method,
                'patient_name' => $serviceRequest->patient->full_name,
                'notes' => $request->notes,
                'user_id' => Auth::id(),
                'service_request_id' => $serviceRequest->id,
            ]);

            // Update service request status
            $serviceRequest->update([
                'payment_status' => \App\Models\ServiceRequest::PAYMENT_PAID,
                'paid_amount' => $request->amount,
                'payment_date' => now(),
                'payment_transaction_id' => $transaction->id,
            ]);

            // Update session totals
            $activeSession->increment('total_income', $request->amount);

            return response()->json([
                'success' => true,
                'message' => 'Cobro procesado exitosamente.',
                'transaction' => $transaction,
            ]);

        } catch (\Exception $e) {
            Log::error('Error processing service payment', [
                'error' => $e->getMessage(),
                'service_request_id' => $request->service_request_id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al procesar el cobro. Intente nuevamente.',
            ], 500);
        }
    }
}