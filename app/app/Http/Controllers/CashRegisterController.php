<?php

namespace App\Http\Controllers;

use App\Services\CashRegisterService;
use App\Services\PaymentService;
use App\Services\AuditService;
use App\Models\CashRegisterSession;
use App\Models\User;
use App\Models\Professional;
use App\Models\Transaction;
use App\Models\Service;
use App\Models\ServiceRequest;
use App\Models\InsuranceType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
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
            ]);

            // Get a condensed summary for the UI
            try {
                $sessionSummary = $this->cashRegisterService->getSessionSummary($activeSession);

                $todayTransactions = $sessionSummary['transactions']['recent'] ?? collect();

                $balance = [
                    'opening' => $sessionSummary['summary']['initial_amount'] ?? 0.0,
                    'income' => $sessionSummary['summary']['total_income'] ?? 0.0,
                    'expense' => $sessionSummary['summary']['total_expenses'] ?? 0.0,
                    'current' => $sessionSummary['summary']['calculated_balance'] ?? 0.0,
                ];
            } catch (\Exception $e) {
                Log::error('Error while building session summary', ['error' => $e->getMessage()]);
            }

        }

        // Render dashboard with computed values
        return Inertia::render('CashRegister/Dashboard', [
            'activeSession' => $activeSession,
            'todayTransactions' => $todayTransactions,
            'balance' => $balance,
        ]);
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
                return redirect()->back()->with('error', 'No hay sesión de caja activa.');
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
                return redirect()->back()->with('error', 'No hay sesión de caja activa.');
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
        $query = ServiceRequest::with([
            'patient',
            'details.medicalService',
            'details.insuranceType',
            'details.professional'
        ]);

        // Filter by payment status (frontend uses `payment_status` query param)
        if ($request->payment_status && $request->payment_status !== 'all') {
            if ($request->payment_status === 'pending') {
                $query->where('payment_status', ServiceRequest::PAYMENT_PENDING);
            } elseif ($request->payment_status === 'partial') {
                $query->where('payment_status', ServiceRequest::PAYMENT_PARTIAL);
            } elseif ($request->payment_status === 'paid') {
                $query->where('payment_status', ServiceRequest::PAYMENT_PAID);
            }
        } else {
            // Default: only pending when no filter provided; if explicit 'all' selected, don't filter
            if (!$request->has('payment_status')) {
                $query->where('payment_status', ServiceRequest::PAYMENT_PENDING);
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

        // Filter by insurance type (expecting insurance_type as insurance_types.id)
        if ($request->insurance_type && $request->insurance_type !== 'all') {
            $qValue = $request->insurance_type;
            $query->whereHas('details', function ($q) use ($qValue) {
                $q->where('insurance_type_id', $qValue);
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
                // Include the associated payment transaction id when available so the UI can reference it
                'payment_transaction_id' => $request->payment_transaction_id ?? null,
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
        $professionals = Professional::where('status', 'active')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name']);

        $insuranceTypes = InsuranceType::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('CashRegister/PendingServices', [
            'serviceRequests' => $serviceRequests,
            'professionals' => $professionals,
            'insuranceTypes' => $insuranceTypes,
            'filters' => $request->only(['payment_status', 'status', 'date_from', 'date_to', 'search', 'professional_id', 'insurance_type']),
            'summary' => [
                'pending_count' => ServiceRequest::where('payment_status', ServiceRequest::PAYMENT_PENDING)->count(),
                'pending_total' => ServiceRequest::where('payment_status', ServiceRequest::PAYMENT_PENDING)->sum('total_amount'),
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
            $serviceRequest = ServiceRequest::findOrFail($request->service_request_id);
            
            // Verify service is pending payment
            if ($serviceRequest->payment_status !== ServiceRequest::PAYMENT_PENDING) {
                if ($request->header('X-Inertia')) {
                    return response()->json(['success' => false, 'message' => 'Este servicio ya ha sido procesado.'], 422);
                }

                return redirect()->back()->with('error', 'Este servicio ya ha sido procesado.');
            }

            // Get active cash register session
            $activeSession = $this->cashRegisterService->getActiveSession(Auth::user());
            if (!$activeSession) {
                if ($request->header('X-Inertia')) {
                    return response()->json(['success' => false, 'message' => 'No hay una sesión de caja activa. Abra la caja primero.'], 422);
                }

                return redirect()->back()->with('error', 'No hay una sesión de caja activa. Abra la caja primero.');
            }

            // Determine category based on service origin
            $category = match($serviceRequest->reception_type) {
                'RECEPTION_SCHEDULED', 'RECEPTION_WALK_IN' => 'SERVICE_PAYMENT',
                'INPATIENT_DISCHARGE' => 'INPATIENT_DISCHARGE_PAYMENT',
                'EMERGENCY' => 'EMERGENCY_DISCHARGE_PAYMENT',
                default => 'SERVICE_PAYMENT'
            };
            // Transactional processing: make sure to rollback on failure
            DB::beginTransaction();
            try {
                // Create income transaction (add payment_method only if the column exists)
                $transactionData = [
                    'cash_register_session_id' => $activeSession->id,
                    'type' => 'INCOME',
                    'category' => $category,
                    'amount' => $request->amount,
                    'concept' => "Cobro: {$serviceRequest->request_number} - {$serviceRequest->patient->full_name}",
                    'patient_name' => $serviceRequest->patient->full_name,
                    'notes' => $request->notes,
                    'user_id' => Auth::id(),
                    'service_request_id' => $serviceRequest->id,
                ];

                if (Schema::hasColumn('transactions', 'payment_method')) {
                    $transactionData['payment_method'] = $request->payment_method;
                }

                $transaction = Transaction::create($transactionData);

                // Update service request status
                $serviceRequest->update([
                    'payment_status' => ServiceRequest::PAYMENT_PAID,
                    'paid_amount' => $request->amount,
                    'payment_date' => now(),
                    'payment_transaction_id' => $transaction->id,
                ]);
                // Update session totals
                $activeSession->increment('total_income', $request->amount);

                DB::commit();

                // If this is an X-Inertia request (Inertia client), return JSON so front-end can update inline
                if ($request->header('X-Inertia')) {
                    return response()->json([
                        'success' => true,
                        'transaction' => $transaction,
                        'service_request' => [
                            'id' => $serviceRequest->id,
                            'payment_status' => $serviceRequest->payment_status,
                        ],
                    ]);
                }

                // Fallback: redirect (useful for non-Inertia requests and tests)
                return redirect()->route('cash-register.pending-services')->with('success', 'Cobro procesado exitosamente.');
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Error processing service payment', [
                    'error' => $e->getMessage(),
                    'service_request_id' => $request->service_request_id,
                ]);

                return redirect()->back()->with('error', 'Error al procesar el cobro. Intente nuevamente.');
            }

        } catch (\Exception $e) {
            Log::error('Error processing service payment', [
                'error' => $e->getMessage(),
                'service_request_id' => $request->service_request_id,
            ]);

            return redirect()->back()->with('error', 'Error al procesar el cobro. Intente nuevamente.');
        }
    }

    /**
     * Refund / cancel a paid service from the cash register (creates a refund transaction
     * and marks the related service request as cancelled with a note that it was cancelled
     * from the cash register). This endpoint is intended to be called only from the
     * cash register UI and will return JSON for XHR requests.
     */
    public function refundServicePayment(Request $request)
    {
        $request->validate([
            'service_request_id' => 'required|exists:service_requests,id',
            // transaction_id is optional: if not provided we will try to find the original transaction by service_request_id
            'transaction_id' => 'nullable|exists:transactions,id',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'nullable|string|max:500',
        ]);

        try {
            $serviceRequest = ServiceRequest::findOrFail($request->service_request_id);
            // Resolve original transaction: prefer explicit transaction_id, otherwise try to find the latest INCOME
            if ($request->transaction_id) {
                $originalTransaction = Transaction::findOrFail($request->transaction_id);
            } else {
                // First try: transaction linked directly by service_request_id
                $originalTransaction = Transaction::where('service_request_id', $serviceRequest->id)
                    ->where('type', 'INCOME')
                    ->latest()
                    ->first();

                // If not found, try to locate by concept containing the request number
                if (!$originalTransaction) {
                    Log::warning('Original transaction not found by service_request_id, attempting search by concept', ['service_request_id' => $serviceRequest->id, 'request_number' => $serviceRequest->request_number]);

                    $originalTransaction = Transaction::where('type', 'INCOME')
                        ->where('concept', 'like', '%' . $serviceRequest->request_number . '%')
                        ->latest()
                        ->first();
                }

                // If still not found, try to match by patient name + amount (best-effort)
                if (!$originalTransaction) {
                    Log::warning('Original transaction not found by concept, attempting search by patient name and amount', ['patient' => $serviceRequest->patient->full_name, 'amount' => $serviceRequest->total_amount]);

                    $originalTransaction = Transaction::where('type', 'INCOME')
                        ->where('patient_name', $serviceRequest->patient->full_name)
                        ->where('amount', $serviceRequest->total_amount)
                        ->latest()
                        ->first();
                }

                // Final fallback: if still not found, return a clear error with guidance
                if (!$originalTransaction) {
                    Log::error('Unable to locate original transaction for refund', ['service_request_id' => $serviceRequest->id]);

                    $msg = 'No se encontró la transacción original para esta solicitud. Provee el id de la transacción o realiza una devolución manual desde la caja.';
                    if ($request->header('X-Inertia')) {
                        return response()->json(['success' => false, 'message' => $msg], 422);
                    }

                    return redirect()->back()->with('error', $msg);
                }
            }

            // Only allow refund when request is already paid (we handle other flows elsewhere)
            if ($serviceRequest->payment_status !== ServiceRequest::PAYMENT_PAID) {
                if ($request->header('X-Inertia')) {
                    return response()->json(['success' => false, 'message' => 'La solicitud no está en estado pagado.'], 422);
                }

                return redirect()->back()->with('error', 'La solicitud no está en estado pagado.');
            }

            // Basic sanity: refund amount should not exceed original payment amount
            if ($request->amount > $originalTransaction->amount) {
                if ($request->header('X-Inertia')) {
                    return response()->json(['success' => false, 'message' => 'El monto de la devolución no puede ser mayor al cobrado.'], 422);
                }

                return redirect()->back()->with('error', 'El monto de la devolución no puede ser mayor al cobrado.');
            }

            $activeSession = $this->cashRegisterService->getActiveSession(Auth::user());
            if (!$activeSession) {
                if ($request->header('X-Inertia')) {
                    return response()->json(['success' => false, 'message' => 'No hay una sesión de caja activa.'], 422);
                }

                return redirect()->back()->with('error', 'No hay una sesión de caja activa.');
            }

            DB::beginTransaction();
            try {
                // Create refund transaction
                $refundData = [
                    'cash_register_session_id' => $activeSession->id,
                    'type' => 'EXPENSE',
                    'category' => 'SERVICE_REFUND',
                    'amount' => $request->amount,
                    'concept' => "Devolución: {$serviceRequest->request_number} - {$serviceRequest->patient->full_name}",
                    'patient_name' => $serviceRequest->patient->full_name,
                    'notes' => $request->reason ?? 'Devolución iniciada desde caja',
                    'user_id' => Auth::id(),
                    'original_transaction_id' => $originalTransaction->id,
                    'service_request_id' => $serviceRequest->id,
                ];

                $refund = Transaction::create($refundData);

                // Mark original transaction as cancelled / reversed
                $originalTransaction->update([
                    'status' => 'cancelled',
                    'cancellation_reason' => 'Devuelto desde caja, transacción de devolución: ' . $refund->id,
                    'cancelled_by' => Auth::id(),
                    'cancelled_at' => now(),
                ]);

                // Adjust session totals
                $activeSession->decrement('total_income', $refund->amount);
                $activeSession->increment('total_expenses', $refund->amount);

                // Cancel the service request and add a clear reason that it was cancelled from the cash register
                $cancelReason = ($request->reason ? $request->reason . ' - ' : '') . "Cancelado desde caja (devolución) - transacción: {$refund->id}";
                $serviceRequest->cancel(Auth::id(), $cancelReason);

                DB::commit();

                if ($request->header('X-Inertia')) {
                    return response()->json([
                        'success' => true,
                        'refund_transaction' => $refund,
                        'service_request' => [
                            'id' => $serviceRequest->id,
                            'status' => $serviceRequest->status,
                            'cancellation_reason' => $serviceRequest->cancellation_reason,
                        ],
                    ]);
                }

                return redirect()->route('cash-register.index')->with('success', 'Devolución procesada y solicitud cancelada.');
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Error processing refund for service request', ['error' => $e->getMessage(), 'service_request_id' => $serviceRequest->id]);

                if ($request->header('X-Inertia')) {
                    return response()->json(['success' => false, 'message' => 'Error al procesar la devolución.'], 500);
                }

                return redirect()->back()->with('error', 'Error al procesar la devolución.');
            }

        } catch (\Exception $e) {
            Log::error('Error processing refund for service request', ['error' => $e->getMessage()]);
            if ($request->header('X-Inertia')) {
                return response()->json(['success' => false, 'message' => 'Error al procesar la devolución.'], 500);
            }

            return redirect()->back()->with('error', 'Error al procesar la devolución.');
        }
    }
}