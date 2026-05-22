<?php

namespace App\Http\Controllers;

use App\Events\ServiceRequestPaymentUpdated;
use App\Services\CashRegisterService;
use App\Services\NotificationRecipientResolver;
use App\Services\PaymentService;
use App\Models\CashRegisterSession;
use App\Models\Professional;
use App\Models\Transaction;
use App\Models\ServiceRequest;
use App\Models\InsuranceType;
use App\Models\User;
use App\Models\ConsultationQueue;
use App\Events\PatientEnteredQueue;
use App\Notifications\ReceptionPaymentUpdatedNotification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class CashRegisterController extends Controller
{
    /**
     * Cierra la sesión de caja activa del usuario
     */
    public function close(Request $request)
    {
        $user = Auth::user();
        $activeSession = $this->cashRegisterService->getActiveSession($user);
        if (!$activeSession) {
            if ($request->header('X-Inertia')) {
                return Inertia::location(route('cash-register.index'));
            }
            return redirect()->back()->with('error', 'No hay una sesión de caja activa.');
        }

        // Registrar cierre
        $calculatedBalance = $activeSession->calculateBalance();
        $activeSession->status = 'closed';
        $activeSession->closing_date = now();
        $activeSession->calculated_balance = $calculatedBalance;
        if ($request->has('final_physical_amount')) {
            $activeSession->final_physical_amount = $request->input('final_physical_amount');
        }
        $activeSession->difference = ($activeSession->final_physical_amount ?? 0) - $calculatedBalance;
        $activeSession->save();

        if ($request->header('X-Inertia')) {
            return Inertia::location(route('cash-register.index'));
        }
        return redirect()->route('cash-register.index')->with('success', 'Caja cerrada correctamente.');
    }
    /**
     * Abrir una nueva sesión de caja
     */
    public function open(Request $request)
    {
        $request->validate([
            'initial_amount' => 'required|numeric|min:0',
        ]);

        $user = Auth::user();
        // Cerrar cualquier sesión abierta previa
        CashRegisterSession::where('user_id', $user->id)
            ->where('status', 'open')
            ->update(['status' => 'closed', 'closing_date' => now()]);

        // Crear nueva sesión
        $session = CashRegisterSession::create([
            'user_id' => $user->id,
            'opening_date' => now(),
            'initial_amount' => $request->initial_amount,
            'status' => 'open',
            'total_income' => 0,
            'total_expenses' => 0,
            'calculated_balance' => $request->initial_amount,
        ]);

        return redirect()->route('cash-register.index')->with('success', 'Caja abierta correctamente.');
    }

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

        $sessionDashboardData = $this->buildSessionDashboardData($activeSession);
        $approvedCommissionLiquidations = $this->getApprovedCommissionLiquidations();
        $suggestedInitialAmount = $this->getSuggestedInitialAmount((int) $user->id);

        // Render dashboard with computed values
        return Inertia::render('CashRegister/Dashboard', [
            'activeSession' => $activeSession,
            'todayTransactions' => $sessionDashboardData['todayTransactions'],
            'balance' => $sessionDashboardData['balance'],
            'approvedCommissionLiquidations' => $approvedCommissionLiquidations,
            'suggestedInitialAmount' => $suggestedInitialAmount,
        ]);
    }

    /**
     * Construye los datos de resumen de la sesión activa para el dashboard.
     *
     * @return array{todayTransactions: \Illuminate\Support\Collection<int, mixed>, balance: array{opening: float, income: float, expense: float, current: float}}
     */
    private function buildSessionDashboardData(?CashRegisterSession $activeSession): array
    {
        $todayTransactions = collect();
        $balance = [
            'opening' => 0.0,
            'income' => 0.0,
            'expense' => 0.0,
            'current' => 0.0,
        ];

        if (!$activeSession) {
            return [
                'todayTransactions' => $todayTransactions,
                'balance' => $balance,
            ];
        }

        \Log::info('🔧 DEBUG: Processing active session', [
            'session_id' => $activeSession->id,
            'initial_amount' => $activeSession->initial_amount,
        ]);

        try {
            $sessionSummary = $this->cashRegisterService->getSessionSummary($activeSession);

            $todayTransactions = $sessionSummary['transactions']['recent'] ?? collect();
            $balance = [
                'opening' => (float) ($sessionSummary['summary']['initial_amount'] ?? 0),
                'income' => (float) ($sessionSummary['summary']['total_income'] ?? 0),
                'expense' => (float) ($sessionSummary['summary']['total_expenses'] ?? 0),
                'current' => (float) ($sessionSummary['summary']['calculated_balance'] ?? 0),
            ];
        } catch (\Exception $e) {
            Log::error('Error while building session summary', ['error' => $e->getMessage()]);
        }

        return [
            'todayTransactions' => $todayTransactions,
            'balance' => $balance,
        ];
    }

    /**
     * Obtiene las liquidaciones de comisión aprobadas y pendientes de pago.
     */
    private function getApprovedCommissionLiquidations()
    {
        return \App\Models\CommissionLiquidation::with('professional')
            ->where('status', \App\Models\CommissionLiquidation::STATUS_APPROVED)
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Calcula el monto inicial sugerido desde la última caja cerrada del usuario.
     */
    private function getSuggestedInitialAmount(int $userId): float
    {
        $lastClosedSession = CashRegisterSession::where('user_id', $userId)
            ->where('status', 'closed')
            ->orderBy('closing_date', 'desc')
            ->first();

        return $lastClosedSession ? (float) $lastClosedSession->calculateBalance() : 0.0;
    }

    /**
     * Register an income transaction
     */
    public function registerIncome(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:255',
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
                'user_id' => Auth::id(),
            ]);

            return redirect()->route('cash-register.index')->with('success', 'Ingreso registrado exitosamente.');
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
        
        $transactions = Transaction::with(['user'])
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
                    'created_at' => $transaction->created_at,
                ];
            });

        return Inertia::render('CashRegister/History', [
            'transactions' => $transactions,
            'filters' => $request->only(['date_from', 'date_to', 'type']),
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

        // Filtro extendido: permitir ver cancelados
        if ($request->payment_status && $request->payment_status !== 'all') {
            if ($request->payment_status === 'pending') {
                $query->where('payment_status', ServiceRequest::PAYMENT_PENDING)
                    ->where('status', '!=', ServiceRequest::STATUS_CANCELLED);
            } elseif ($request->payment_status === 'partial') {
                $query->where('payment_status', ServiceRequest::PAYMENT_PARTIAL)
                    ->where('status', '!=', ServiceRequest::STATUS_CANCELLED);
            } elseif ($request->payment_status === 'paid') {
                $query->where('payment_status', ServiceRequest::PAYMENT_PAID)
                    ->where('status', '!=', ServiceRequest::STATUS_CANCELLED);
            } elseif ($request->payment_status === 'cancelled') {
                $query->where('status', ServiceRequest::STATUS_CANCELLED);
            }
        } else {
            // Default: solo pendientes si no hay filtro; si 'all', no filtrar
            if (!$request->has('payment_status')) {
                $query->where('payment_status', ServiceRequest::PAYMENT_PENDING)
                    ->where('status', '!=', ServiceRequest::STATUS_CANCELLED);
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
                // Primary professional assigned on the service request (if any)
                'primary_professional_id' => optional($request->details->first())->professional_id ?? null,
                'primary_professional_name' => optional(optional($request->details->first())->professional)->full_name ?? null,
                'priority' => $request->priority,
                'total_amount' => $request->total_amount,
                'paid_amount' => $request->paid_amount,
                'remaining_amount' => $request->total_amount - $request->paid_amount,
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
                // Agregar array de transacciones asociadas
                'transactions' => Transaction::where('service_request_id', $request->id)->get()->map(function ($tx) {
                    return [
                        'service_request_id' => $tx->service_request_id,
                        'id' => $tx->id,
                        'amount' => $tx->amount,
                        'type' => $tx->type,
                        'category' => $tx->category,
                        'concept' => $tx->concept,
                        'status' => $tx->status,
                        'payment_method' => $tx->payment_method,
                        'created_at' => $tx->created_at?->format('Y-m-d H:i'),
                    ];
                })->toArray(),
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

        // Calculate summary - including paid total from current cash session
        $pendingCount = ServiceRequest::where('payment_status', ServiceRequest::PAYMENT_PENDING)
            ->where('status', '!=', ServiceRequest::STATUS_CANCELLED)
            ->count();
        $pendingTotal = ServiceRequest::where('payment_status', ServiceRequest::PAYMENT_PENDING)
            ->where('status', '!=', ServiceRequest::STATUS_CANCELLED)
            ->sum('total_amount');
        
        // Get paid total from current active cash session
        $activeSession = CashRegisterSession::where('user_id', Auth::id())
            ->where('status', 'open')
            ->latest()
            ->first();
        
        $paidTotal = 0;
        if ($activeSession) {
            $paidTotal = Transaction::where('cash_register_session_id', $activeSession->id)
                ->where('category', 'SERVICE_PAYMENT')
                ->whereHas('serviceRequest', function ($q) {
                    $q->where('status', '!=', ServiceRequest::STATUS_CANCELLED);
                })
                ->sum('amount');
        }

        return Inertia::render('CashRegister/PendingServices', [
            'serviceRequests' => $serviceRequests,
            'professionals' => $professionals,
            'insuranceTypes' => $insuranceTypes,
            'filters' => [
                'payment_status' => $request->get('payment_status', 'pending'),
                'status' => $request->get('status', ''),
                'date_from' => $request->get('date_from', now()->format('Y-m-d')),
                'date_to' => $request->get('date_to', now()->format('Y-m-d')),
                'search' => $request->get('search', ''),
                'professional_id' => $request->get('professional_id', ''),
                'insurance_type' => $request->get('insurance_type', ''),
            ],
            'summary' => [
                'pending_count' => $pendingCount,
                'pending_total' => $pendingTotal,
                'paid_total' => $paidTotal,
            ]
        ]);
    }

    /**
     * Process service payment
     */
    public function processServicePayment(Request $request): JsonResponse|RedirectResponse
    {
        try {
            $payments = $this->resolveServicePaymentSplits($request);
            $serviceRequest = ServiceRequest::findOrFail($request->service_request_id);
            $validationError = $this->validateServicePaymentEligibility($request, $serviceRequest, $payments);
            if ($validationError !== null) {
                return $validationError;
            }

            $activeSession = $this->cashRegisterService->getActiveSession(Auth::user());
            if (!$activeSession) {
                return $this->servicePaymentFailureResponse($request, 'No hay una sesión de caja activa. Abra la caja primero.');
            }

            $this->persistServicePayment($request, $serviceRequest, $payments, $activeSession);

            return $this->servicePaymentSuccessResponse($request);
        } catch (\Exception $e) {
            Log::error('Error processing service payment', [
                'error' => $e->getMessage(),
                'service_request_id' => $request->service_request_id,
            ]);

            return $this->servicePaymentFailureResponse($request, 'Error al procesar el cobro. Intente nuevamente.');
        }
    }

    /**
     * Normaliza y valida los pagos enviados para una solicitud de servicio.
     *
     * @return array<int, array{payment_method: string, amount: float|int, pos_number: string|null}>
     */
    private function resolveServicePaymentSplits(Request $request): array
    {
        if ($request->has('payments')) {
            $request->validate([
                'service_request_id' => 'required|exists:service_requests,id',
                'notes' => 'nullable|string|max:255',
                'payments' => 'required|array|min:1',
                'payments.*.payment_method' => 'required|string',
                'payments.*.amount' => 'required|numeric|min:0.01',
                'payments.*.pos_number' => 'nullable|string|max:100',
            ]);

            return $request->input('payments', []);
        }

        $request->validate([
            'service_request_id' => 'required|exists:service_requests,id',
            'payment_method' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:255',
        ]);

        return [[
            'payment_method' => (string) $request->payment_method,
            'amount' => $request->amount,
            'pos_number' => $request->pos_number ?? null,
        ]];
    }

    /**
     * Valida que la solicitud todavía pueda ser cobrada.
     */
    private function validateServicePaymentEligibility(Request $request, ServiceRequest $serviceRequest, array $payments): JsonResponse|RedirectResponse|null
    {
        if (!in_array($serviceRequest->payment_status, [ServiceRequest::PAYMENT_PENDING, ServiceRequest::PAYMENT_PARTIAL], true)) {
            return $this->servicePaymentFailureResponse($request, 'Este servicio ya ha sido procesado completamente.');
        }

        $totalAmount = collect($payments)->sum('amount');
        $remainingAmount = (float) $serviceRequest->total_amount - (float) $serviceRequest->paid_amount;

        if ($totalAmount > $remainingAmount) {
            return $this->servicePaymentFailureResponse($request, 'El monto total del pago no puede exceder el pendiente.');
        }

        return null;
    }

    /**
     * Persiste la transacción y actualiza la solicitud de servicio.
     */
    private function persistServicePayment(Request $request, ServiceRequest $serviceRequest, array $payments, CashRegisterSession $activeSession): void
    {
        $totalAmount = collect($payments)->sum('amount');

        DB::beginTransaction();
        try {
            $professionalId = $serviceRequest->details()->first()?->professional_id;
            $hasPaymentMethod = Schema::hasColumn('transactions', 'payment_method');
            $lastTransaction = null;

            $category = match ($serviceRequest->reception_type) {
                'RECEPTION_SCHEDULED', 'RECEPTION_WALK_IN' => 'SERVICE_PAYMENT',
                'INPATIENT_DISCHARGE' => 'INPATIENT_DISCHARGE_PAYMENT',
                'EMERGENCY' => 'EMERGENCY_DISCHARGE_PAYMENT',
                default => 'SERVICE_PAYMENT',
            };

            foreach ($payments as $split) {
                $transactionData = [
                    'cash_register_session_id' => $activeSession->id,
                    'type' => 'INCOME',
                    'category' => $category,
                    'amount' => $split['amount'],
                    'concept' => "Cobro: {$serviceRequest->request_number} - {$serviceRequest->patient->full_name}",
                    'patient_name' => $serviceRequest->patient->full_name,
                    'patient_id' => $serviceRequest->patient_id,
                    'professional_id' => $professionalId,
                    'notes' => $request->notes,
                    'user_id' => Auth::id(),
                    'service_request_id' => $serviceRequest->id,
                ];

                if ($hasPaymentMethod) {
                    $transactionData['payment_method'] = $split['payment_method'];
                }

                $lastTransaction = Transaction::create($transactionData);
            }

            $newPaidAmount = (float) $serviceRequest->paid_amount + $totalAmount;
            $isFullyPaid = $newPaidAmount >= (float) $serviceRequest->total_amount;

            $serviceRequest->update([
                'paid_amount' => $newPaidAmount,
                'status' => $isFullyPaid ? ServiceRequest::STATUS_PAID : ServiceRequest::STATUS_PENDING_PAYMENT,
                'payment_status' => $isFullyPaid ? ServiceRequest::PAYMENT_PAID : ServiceRequest::PAYMENT_PARTIAL,
                'payment_date' => $isFullyPaid ? now() : $serviceRequest->payment_date,
                'payment_transaction_id' => $isFullyPaid ? $lastTransaction->id : $serviceRequest->payment_transaction_id,
            ]);

            $activeSession->increment('total_income', $totalAmount);

            DB::commit();

            $updatedServiceRequest = $serviceRequest->fresh(['patient', 'details']);

            ServiceRequestPaymentUpdated::dispatch($updatedServiceRequest);

            $message = $updatedServiceRequest->payment_status === ServiceRequest::PAYMENT_PAID
                ? 'Pago completado en caja.'
                : 'Pago parcial registrado en caja.';

            app(NotificationRecipientResolver::class)
                ->receptionPaymentRecipients()
                ->each
                ->notify(new ReceptionPaymentUpdatedNotification($updatedServiceRequest, $message));

            // Optionally auto-send the patient to consultorio (lista de espera)
            // Frontend may include `send_to_consultorio` and `doctor_id` in the payment request.
            if ($request->has('send_to_consultorio') && $request->filled('doctor_id')) {
                try {
                    $doctor = User::find($request->input('doctor_id'));
                    if ($doctor && method_exists($doctor, 'hasRole') && $doctor->hasRole('doctor')) {
                        $priority = 'normal';
                        $p = $request->input('priority');
                        if (is_numeric($p)) {
                            $priority = ((int)$p > 0) ? 'urgent' : 'normal';
                        } elseif (in_array($p, ['normal', 'urgent'])) {
                            $priority = $p === 'urgent' ? 'urgent' : 'normal';
                        }

                        // Delegate to the model helper which handles duplicates and broadcasting
                        \App\Models\ConsultationQueue::enqueueFromServiceRequest($updatedServiceRequest, $doctor->id, $priority);
                    } else {
                        Log::warning('Doctor not valid for auto-send to consultorio', ['doctor_id' => $request->input('doctor_id')]);
                    }
                } catch (\Throwable $e) {
                    Log::error('Error auto-sending patient to consultorio', ['error' => $e->getMessage(), 'service_request_id' => $updatedServiceRequest->id ?? null]);
                }
            }

            // If the request just became fully paid, and there is a professional assigned
            // on the service request details, automatically enqueue the patient to that
            // professional's consultorio queue (only if not already enqueued).
            if ($isFullyPaid) {
                try {
                    // Try to resolve assigned professional user id and delegate to helper
                    $assignedProfessionalId = $serviceRequest->details()->whereNotNull('professional_id')->pluck('professional_id')->first();
                    $doctorUserId = null;
                    if ($assignedProfessionalId) {
                        $professional = Professional::find($assignedProfessionalId);
                        $doctorUserId = $professional?->user_id ?? null;
                        if (!$doctorUserId && $professional?->email) {
                            $linkedUser = User::where('email', $professional->email)->first();
                            if ($linkedUser && method_exists($linkedUser, 'hasRole') && $linkedUser->hasRole('doctor')) {
                                $doctorUserId = $linkedUser->id;
                            }
                        }
                    }

                    \App\Models\ConsultationQueue::enqueueFromServiceRequest($updatedServiceRequest, $doctorUserId, $request->input('priority') ?? null);
                } catch (\Throwable $e) {
                    Log::error('Error auto-sending fully paid patient to consultorio', ['error' => $e->getMessage(), 'service_request_id' => $updatedServiceRequest->id ?? null]);
                }
            }
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Respuesta de éxito para cobros de caja.
     */
    private function servicePaymentSuccessResponse(Request $request): JsonResponse|RedirectResponse
    {
        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Cobro procesado exitosamente.');
        }

        return redirect()->route('cash-register.pending-services')->with('success', 'Cobro procesado exitosamente.');
    }

    /**
     * Respuesta de error para cobros de caja.
     */
    private function servicePaymentFailureResponse(Request $request, string $message): JsonResponse|RedirectResponse
    {
        if ($request->header('X-Inertia')) {
            return response()->json(['success' => false, 'message' => $message], 422);
        }

        return redirect()->back()->with('error', $message);
    }

    /**
     * Register an expense transaction
     */
    public function registerExpense(Request $request)
    {
        $request->validate([
            'category' => 'required|string',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            // Get active cash register session
            $activeSession = $this->cashRegisterService->getActiveSession(Auth::user());
            if (!$activeSession) {
                if ($request->header('X-Inertia')) {
                    return response()->json(['success' => false, 'message' => 'No hay una sesión de caja activa. Abra la caja primero.'], 422);
                }

                return redirect()->back()->with('error', 'No hay una sesión de caja activa. Abra la caja primero.');
            }

            DB::beginTransaction();
            try {
                // Create expense transaction
                $transactionData = [
                    'cash_register_session_id' => $activeSession->id,
                    'type' => 'EXPENSE',
                    'category' => $request->category,
                    'amount' => $request->amount,
                    'concept' => $request->description,
                    'notes' => $request->notes,
                    'user_id' => Auth::id(),
                ];

                if (Schema::hasColumn('transactions', 'payment_method')) {
                    $transactionData['payment_method'] = 'cash'; // Egresos generalmente en efectivo
                }

                Transaction::create($transactionData);

                // Update session totals
                $activeSession->increment('total_expense', $request->amount);

                DB::commit();

                if ($request->header('X-Inertia')) {
                    return response()->json(['success' => true, 'message' => 'Egreso registrado correctamente.']);
                }

                return redirect()->route('cash-register.index')->with('success', 'Egreso registrado correctamente.');
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Error registering expense', [
                    'error' => $e->getMessage(),
                    'request' => $request->all(),
                ]);

                return redirect()->back()->with('error', 'Error al registrar el egreso. Intente nuevamente.');
            }

        } catch (\Exception $e) {
            Log::error('Error registering expense', [
                'error' => $e->getMessage(),
                'request' => $request->all(),
            ]);

            return redirect()->back()->with('error', 'Error al registrar el egreso. Intente nuevamente.');
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
            // Validar que no se pueda devolver si ya está cancelado
            if ($serviceRequest->payment_status === 'cancelled') {
                if ($request->header('X-Inertia')) {
                    return response()->json(['success' => false, 'message' => 'La solicitud ya fue cancelada y no puede devolverse nuevamente.'], 422);
                }
                return redirect()->back()->with('error', 'La solicitud ya fue cancelada y no puede devolverse nuevamente.');
            }
            // Resolver transacción original: preferir transaction_id explícito, si no buscar por service_request_id
            if ($request->transaction_id) {
                $originalTransaction = Transaction::findOrFail($request->transaction_id);
            } else {
                $originalTransaction = Transaction::where('service_request_id', $serviceRequest->id)
                    ->where('type', 'INCOME')
                    ->latest()
                    ->first();
                if (!$originalTransaction) {
                    Log::error('Original transaction not found by service_request_id', ['service_request_id' => $serviceRequest->id, 'request_number' => $serviceRequest->request_number]);
                    $msg = 'No se encontró la transacción original enlazada a esta solicitud. Proporciona `transaction_id` manualmente.';
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

                // Ensure `service_request_id` is persisted even if it's not fillable
                if (empty($refund->service_request_id)) {
                    $refund->service_request_id = $serviceRequest->id;
                    $refund->save();
                }

                // Mark original transaction as cancelled / reversed
                $originalTransaction->update([
                    'status' => 'cancelled',
                    'cancellation_reason' => 'Devuelto desde caja, transacción de devolución: ' . $refund->id,
                    'cancelled_by' => Auth::id(),
                    'cancelled_at' => now(),
                ]);
                // Adjust session totals
                // Solo compensar el ingreso, no sumar como gasto
                $activeSession->decrement('total_income', $refund->amount);

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