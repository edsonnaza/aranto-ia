<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use App\Models\Transaction;
use App\Models\CashRegisterSession;
use App\Models\Service;

class TransactionController extends Controller
{
    public function __construct(
        private PaymentService $paymentService,
        private AuditService $auditService
    ) {
    }

    /**
     * Procesar pago de servicio médico
     */
    public function processServicePayment(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'service_id' => 'required|exists:services,id',
                'amount' => 'required|numeric|min:0.01',
                'payment_method' => 'required|in:cash,card,transfer,insurance',
                'patient_name' => 'required|string|max:255',
                'patient_document' => 'nullable|string|max:50',
                'notes' => 'nullable|string|max:500',
                'discount_amount' => 'nullable|numeric|min:0',
                'discount_reason' => 'nullable|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos de validación incorrectos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verificar que el usuario tenga una sesión activa
            $session = CashRegisterSession::where('user_id', Auth::id())
                ->where('status', 'open')
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes una sesión de caja activa. Debes abrir una sesión primero.'
                ], 400);
            }

            $service = Service::findOrFail($request->service_id);
            
            $transaction = $this->paymentService->processServicePayment(
                $session,
                $service,
                $request->amount,
                [
                    'payment_method' => $request->payment_method,
                    'patient_name' => $request->patient_name,
                    'patient_document' => $request->patient_document,
                    'discount_amount' => $request->discount_amount ?? 0,
                    'discount_reason' => $request->discount_reason,
                    'notes' => $request->notes
                ],
                null, // patient_id (lo manejamos por nombre por ahora)
                null, // professional_id
                "Pago de {$service->name} - {$request->patient_name}"
            );

            $this->auditService->logActivity(
                $transaction,
                'service_payment_processed',
                null,
                [
                    'service_id' => $service->id,
                    'amount' => $request->amount,
                    'payment_method' => $request->payment_method,
                    'patient_name' => $request->patient_name
                ],
                'Pago de servicio médico procesado'
            );

            return response()->json([
                'success' => true,
                'message' => 'Pago procesado correctamente',
                'data' => [
                    'transaction' => $transaction->load(['service', 'cashRegisterSession']),
                    'session_balance' => $session->fresh()->calculated_balance,
                    'receipt' => [
                        'transaction_id' => $transaction->id,
                        'service_name' => $service->name,
                        'amount' => $transaction->amount,
                        'payment_method' => $transaction->payment_method,
                        'date' => $transaction->created_at->format('d/m/Y H:i:s'),
                        'cashier' => Auth::user()->name
                    ]
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar pago: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Procesar pago a proveedor/gasto
     */
    public function processSupplierPayment(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'description' => 'required|string|max:255',
                'amount' => 'required|numeric|min:0.01',
                'payment_method' => 'required|in:cash,card,transfer',
                'supplier_name' => 'nullable|string|max:255',
                'category' => 'required|in:supplies,maintenance,services,utilities,other',
                'receipt_number' => 'nullable|string|max:100',
                'notes' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos de validación incorrectos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verificar que el usuario tenga una sesión activa
            $session = CashRegisterSession::where('user_id', Auth::id())
                ->where('status', 'open')
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes una sesión de caja activa.'
                ], 400);
            }

            $transaction = $this->paymentService->processSupplierPayment(
                $session,
                $request->amount,
                $request->description . " - " . $request->category,
                [
                    'payment_method' => $request->payment_method,
                    'supplier_name' => $request->supplier_name,
                    'category' => $request->category,
                    'receipt_number' => $request->receipt_number,
                    'notes' => $request->notes
                ]
            );

            $this->auditService->logActivity(
                $transaction,
                'supplier_payment_processed',
                null,
                [
                    'description' => $request->description,
                    'amount' => $request->amount,
                    'payment_method' => $request->payment_method,
                    'supplier_name' => $request->supplier_name,
                    'category' => $request->category
                ],
                'Pago a proveedor procesado'
            );

            return response()->json([
                'success' => true,
                'message' => 'Pago a proveedor procesado correctamente',
                'data' => [
                    'transaction' => $transaction->load('cashRegisterSession'),
                    'session_balance' => $session->fresh()->calculated_balance
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar pago: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener transacciones de la sesión actual
     */
    public function getCurrentSessionTransactions(Request $request): JsonResponse
    {
        try {
            $session = CashRegisterSession::where('user_id', Auth::id())
                ->where('status', 'open')
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes una sesión activa'
                ], 400);
            }

            $validator = Validator::make($request->all(), [
                'type' => 'nullable|in:income,expense',
                'payment_method' => 'nullable|in:cash,card,transfer,insurance',
                'page' => 'integer|min:1',
                'per_page' => 'integer|min:5|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = $session->transactions()
                ->with(['service'])
                ->orderBy('created_at', 'desc');

            // Filtros opcionales
            if ($request->type) {
                $query->where('type', $request->type);
            }
            if ($request->payment_method) {
                $query->where('payment_method', $request->payment_method);
            }

            $transactions = $query->paginate($request->per_page ?? 20);

            // Calcular totales por tipo
            $summary = [
                'total_income' => $session->transactions()->where('type', 'income')->sum('amount'),
                'total_expenses' => $session->transactions()->where('type', 'expense')->sum('amount'),
                'transaction_count' => $session->transactions()->count(),
                'cash_transactions' => $session->transactions()->where('payment_method', 'cash')->sum('amount'),
                'card_transactions' => $session->transactions()->where('payment_method', 'card')->sum('amount'),
                'current_balance' => $session->calculated_balance
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'transactions' => $transactions->items(),
                    'pagination' => [
                        'current_page' => $transactions->currentPage(),
                        'last_page' => $transactions->lastPage(),
                        'per_page' => $transactions->perPage(),
                        'total' => $transactions->total()
                    ],
                    'summary' => $summary
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener transacciones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener detalle de una transacción específica
     */
    public function getTransactionDetail($transactionId): JsonResponse
    {
        try {
            $transaction = Transaction::with(['service', 'cashRegisterSession.user'])
                ->findOrFail($transactionId);

            // Verificar que la transacción pertenece a una sesión del usuario actual
            // o que el usuario tiene permisos para ver todas las transacciones
            if ($transaction->cashRegisterSession->user_id !== Auth::id() && 
                !Auth::user()->can('transactions.view_all')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para ver esta transacción'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'transaction' => $transaction,
                    'audit_trail' => $this->auditService->getModelAuditHistory($transaction, 10)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener detalle de transacción: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Anular una transacción (solo con permisos especiales)
     */
    public function voidTransaction(Request $request, $transactionId): JsonResponse
    {
        try {
            if (!Auth::user()->can('transactions.void')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para anular transacciones'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $transaction = Transaction::findOrFail($transactionId);

            if ($transaction->status === 'voided') {
                return response()->json([
                    'success' => false,
                    'message' => 'La transacción ya está anulada'
                ], 400);
            }

            // Solo se pueden anular transacciones de sesiones cerradas hace menos de 24 horas
            $session = $transaction->cashRegisterSession;
            if ($session->status === 'open' || 
                ($session->closing_date && $session->closing_date->diffInHours(now()) > 24)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden anular transacciones de sesiones cerradas en las últimas 24 horas'
                ], 400);
            }

            $voidedTransaction = $this->paymentService->voidTransaction(
                $transaction,
                $request->reason,
                Auth::user()
            );

            $this->auditService->logActivity(
                $voidedTransaction,
                'transaction_voided',
                $transaction->toArray(),
                $voidedTransaction->toArray(),
                'Transacción anulada: ' . $request->reason
            );

            return response()->json([
                'success' => true,
                'message' => 'Transacción anulada correctamente',
                'data' => [
                    'transaction' => $voidedTransaction
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al anular transacción: ' . $e->getMessage()
            ], 500);
        }
    }
}
