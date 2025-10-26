<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use App\Models\AuditLog;
use App\Models\CashRegisterSession;
use App\Models\Transaction;

class AuditController extends Controller
{
    public function __construct(
        private AuditService $auditService
    ) {
    }

    /**
     * Obtener logs de auditoría generales
     */
    public function getAuditLogs(Request $request): JsonResponse
    {
        try {
            if (!Auth::user()->can('audit.view')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para ver logs de auditoría'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'page' => 'integer|min:1',
                'per_page' => 'integer|min:5|max:100',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'event' => 'nullable|string|max:100',
                'user_id' => 'nullable|integer|exists:users,id',
                'auditable_type' => 'nullable|string|in:App\\Models\\CashRegisterSession,App\\Models\\Transaction,App\\Models\\Service'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parámetros de consulta inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $filters = array_filter([
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
                'event' => $request->event,
                'user_id' => $request->user_id,
                'auditable_type' => $request->auditable_type
            ]);

            $auditData = $this->auditService->getAuditLogs($filters, $request->per_page ?? 20);

            return response()->json([
                'success' => true,
                'data' => $auditData
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener logs de auditoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener historial de auditoría para una sesión específica
     */
    public function getSessionAuditHistory($sessionId): JsonResponse
    {
        try {
            if (!Auth::user()->can('audit.view_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para ver auditoría de sesiones'
                ], 403);
            }

            $session = CashRegisterSession::findOrFail($sessionId);
            
            // Verificar si el usuario puede ver esta sesión
            if ($session->user_id !== Auth::id() && !Auth::user()->can('audit.view_all')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para ver esta sesión'
                ], 403);
            }

            $auditHistory = $this->auditService->getModelAuditHistory($session);
            
            // También obtener auditoría de transacciones relacionadas
            $transactionAudits = [];
            foreach ($session->transactions as $transaction) {
                $transactionAudits[$transaction->id] = $this->auditService->getModelAuditHistory($transaction, 5);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'session' => $session->load(['user', 'transactions']),
                    'session_audit' => $auditHistory,
                    'transactions_audit' => $transactionAudits,
                    'summary' => [
                        'total_audit_entries' => count($auditHistory['audit_logs']) + 
                                                array_sum(array_map(fn($ta) => count($ta['audit_logs']), $transactionAudits)),
                        'session_events' => array_unique(array_column($auditHistory['audit_logs'], 'event')),
                        'involved_users' => array_unique(array_column($auditHistory['audit_logs'], 'user_id'))
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener historial de auditoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener historial de auditoría para una transacción específica
     */
    public function getTransactionAuditHistory($transactionId): JsonResponse
    {
        try {
            if (!Auth::user()->can('audit.view_transactions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para ver auditoría de transacciones'
                ], 403);
            }

            $transaction = Transaction::with(['cashRegisterSession.user'])->findOrFail($transactionId);
            
            // Verificar permisos
            if ($transaction->cashRegisterSession->user_id !== Auth::id() && 
                !Auth::user()->can('audit.view_all')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para ver esta transacción'
                ], 403);
            }

            $auditHistory = $this->auditService->getModelAuditHistory($transaction);

            return response()->json([
                'success' => true,
                'data' => [
                    'transaction' => $transaction,
                    'audit_history' => $auditHistory
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener historial de auditoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generar reporte de actividad por usuario
     */
    public function getUserActivityReport(Request $request): JsonResponse
    {
        try {
            if (!Auth::user()->can('reports.user_activity')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para generar reportes de actividad'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'user_id' => 'nullable|integer|exists:users,id',
                'date_from' => 'required|date',
                'date_to' => 'required|date|after_or_equal:date_from',
                'include_details' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $report = $this->auditService->getUserActivityReport(
                $request->user_id ?? Auth::id(),
                $request->date_from,
                $request->date_to,
                $request->include_details ?? false
            );

            return response()->json([
                'success' => true,
                'data' => $report
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar reporte: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener resumen de actividad del sistema
     */
    public function getSystemActivitySummary(Request $request): JsonResponse
    {
        try {
            if (!Auth::user()->can('reports.system_summary')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para ver resumen del sistema'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'period' => 'in:today,week,month,year',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $summary = $this->auditService->getSystemActivitySummary(
                $request->period ?? 'today',
                $request->date_from,
                $request->date_to
            );

            return response()->json([
                'success' => true,
                'data' => $summary
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener resumen: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar en logs de auditoría
     */
    public function searchAuditLogs(Request $request): JsonResponse
    {
        try {
            if (!Auth::user()->can('audit.search')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para buscar en auditoría'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'query' => 'required|string|min:3|max:255',
                'search_in' => 'array',
                'search_in.*' => 'in:description,old_values,new_values,event',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'limit' => 'integer|min:5|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $searchResults = $this->auditService->searchAuditLogs(
                $request->query,
                $request->search_in ?? ['description', 'event'],
                [
                    'date_from' => $request->date_from,
                    'date_to' => $request->date_to
                ],
                $request->limit ?? 50
            );

            return response()->json([
                'success' => true,
                'data' => $searchResults
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en búsqueda: ' . $e->getMessage()
            ], 500);
        }
    }
}
