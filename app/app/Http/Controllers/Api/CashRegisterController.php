<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CashRegisterService;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use App\Models\CashRegisterSession;
use App\Models\User;

class CashRegisterController extends Controller
{
    public function __construct(
        private CashRegisterService $cashRegisterService,
        private AuditService $auditService
    ) {
    }

    /**
     * Abrir nueva sesión de caja
     */
    public function openSession(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'initial_balance' => 'required|numeric|min:0',
                'notes' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos de validación incorrectos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = User::find(Auth::id());
            $session = $this->cashRegisterService->openSession(
                $user,
                $request->initial_balance,
                $request->notes
            );

            $this->auditService->logActivity(
                $session,
                'cash_register_opened',
                null,
                ['initial_balance' => $request->initial_balance],
                'Sesión de caja abierta desde API'
            );

            return response()->json([
                'success' => true,
                'message' => 'Sesión de caja abierta correctamente',
                'data' => [
                    'session' => $session->load('user'),
                    'permissions' => [
                        'can_close' => Auth::user()->can('cash_register.close'),
                        'can_process_payments' => Auth::user()->can('payments.process'),
                        'can_force_close' => Auth::user()->can('cash_register.force_close')
                    ]
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al abrir sesión de caja: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cerrar sesión de caja actual
     */
    public function closeSession(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'final_balance' => 'required|numeric|min:0',
                'notes' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos de validación incorrectos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Buscar sesión activa del usuario
            $session = CashRegisterSession::where('user_id', Auth::id())
                ->where('status', 'open')
                ->firstOrFail();

            $closedSession = $this->cashRegisterService->closeSession(
                $session,
                $request->final_balance,
                null,
                $request->notes
            );

            $this->auditService->logActivity(
                $closedSession,
                'cash_register_closed',
                null,
                [
                    'final_balance' => $request->final_balance,
                    'difference' => $closedSession->difference
                ],
                'Sesión de caja cerrada desde API'
            );

            return response()->json([
                'success' => true,
                'message' => 'Sesión de caja cerrada correctamente',
                'data' => [
                    'session' => $closedSession->load(['user', 'transactions']),
                    'summary' => [
                        'duration' => $closedSession->opening_date->diffForHumans($closedSession->closing_date),
                        'total_transactions' => $closedSession->transactions()->count(),
                        'expected_balance' => $closedSession->calculated_balance,
                        'actual_balance' => $closedSession->final_physical_amount,
                        'difference' => $closedSession->difference
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cerrar sesión de caja: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Forzar cierre de sesión (solo administradores/gerentes)
     */
    public function forceCloseSession(Request $request, $sessionId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:500',
                'final_balance' => 'required|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos de validación incorrectos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $session = CashRegisterSession::findOrFail($sessionId);
            
            if ($session->status !== 'open') {
                return response()->json([
                    'success' => false,
                    'message' => 'La sesión ya está cerrada'
                ], 400);
            }

            $authorizedBy = User::find(Auth::id());
            $closedSession = $this->cashRegisterService->closeSession(
                $session,
                $request->final_balance,
                $authorizedBy,
                $request->reason
            );

            $this->auditService->logActivity(
                $closedSession,
                'cash_register_force_closed',
                null,
                [
                    'closed_by_user_id' => Auth::id(),
                    'original_user_id' => $session->user_id,
                    'reason' => $request->reason
                ],
                'Sesión forzada a cerrar por administrador'
            );

            return response()->json([
                'success' => true,
                'message' => 'Sesión forzada a cerrar correctamente',
                'data' => [
                    'session' => $closedSession->load(['user', 'transactions'])
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al forzar cierre: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener sesión activa del usuario
     */
    public function getActiveSession(): JsonResponse
    {
        try {
            $session = CashRegisterSession::where('user_id', Auth::id())
                ->where('status', 'open')
                ->with(['user', 'transactions' => function ($query) {
                    $query->latest()->limit(10);
                }])
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => true,
                    'message' => 'No hay sesión activa',
                    'data' => [
                        'session' => null,
                        'permissions' => [
                            'can_open' => Auth::user()->can('cash_register.open'),
                            'can_view_history' => Auth::user()->can('cash_register.view')
                        ]
                    ]
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'session' => $session,
                    'summary' => [
                        'duration' => $session->opening_date->diffForHumans(),
                        'transactions_count' => $session->transactions()->count(),
                        'current_balance' => $session->calculated_balance,
                        'last_transaction' => $session->transactions()->latest()->first()
                    ],
                    'permissions' => [
                        'can_close' => Auth::user()->can('cash_register.close'),
                        'can_process_payments' => Auth::user()->can('payments.process'),
                        'can_force_close' => Auth::user()->can('cash_register.force_close')
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener sesión activa: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener historial de sesiones
     */
    public function getSessionHistory(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'page' => 'integer|min:1',
                'per_page' => 'integer|min:5|max:100',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'user_id' => 'nullable|integer|exists:users,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parámetros de consulta inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = CashRegisterSession::with(['user', 'transactions'])
                ->orderBy('opening_date', 'desc');

            // Filtros opcionales
            if ($request->date_from) {
                $query->whereDate('opening_date', '>=', $request->date_from);
            }
            if ($request->date_to) {
                $query->whereDate('opening_date', '<=', $request->date_to);
            }
            if ($request->user_id && Auth::user()->can('cash_register.view_all')) {
                $query->where('user_id', $request->user_id);
            } else {
                // Los usuarios solo pueden ver sus propias sesiones
                $query->where('user_id', Auth::id());
            }

            $sessions = $query->paginate($request->per_page ?? 20);

            return response()->json([
                'success' => true,
                'data' => [
                    'sessions' => $sessions->items(),
                    'pagination' => [
                        'current_page' => $sessions->currentPage(),
                        'last_page' => $sessions->lastPage(),
                        'per_page' => $sessions->perPage(),
                        'total' => $sessions->total()
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener historial: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas básicas de caja
     */
    public function getStatistics(Request $request): JsonResponse
    {
        try {
            if (!Auth::user()->can('reports.cash_register')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para ver estadísticas'
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

            // Estadísticas básicas - luego expandiremos con más lógica
            $query = CashRegisterSession::query();
            
            switch ($request->period ?? 'today') {
                case 'today':
                    $query->whereDate('opening_date', today());
                    break;
                case 'week':
                    $query->whereBetween('opening_date', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
                case 'month':
                    $query->whereMonth('opening_date', now()->month)
                          ->whereYear('opening_date', now()->year);
                    break;
                case 'year':
                    $query->whereYear('opening_date', now()->year);
                    break;
            }

            if ($request->date_from && $request->date_to) {
                $query->whereBetween('opening_date', [$request->date_from, $request->date_to]);
            }

            $statistics = [
                'total_sessions' => $query->count(),
                'closed_sessions' => $query->where('status', 'closed')->count(),
                'open_sessions' => $query->where('status', 'open')->count(),
                'total_income' => $query->sum('total_income'),
                'total_expenses' => $query->sum('total_expenses'),
                'average_difference' => $query->where('status', 'closed')->avg('difference') ?? 0
            ];

            return response()->json([
                'success' => true,
                'data' => $statistics
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas: ' . $e->getMessage()
            ], 500);
        }
    }
}
