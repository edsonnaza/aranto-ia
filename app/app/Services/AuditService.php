<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\CashRegisterSession;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AuditService
{
    /**
     * Registrar actividad en el log de auditoría
     */
    public function logActivity(
        Model $model,
        string $event,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $description = null,
        ?User $user = null
    ): AuditLog {
        return AuditLog::create([
            'auditable_type' => get_class($model),
            'auditable_id' => $model->id,
            'event' => $event,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'user_id' => $user?->id ?? auth()?->id(),
            'user_agent' => request()?->userAgent(),
            'ip_address' => request()?->ip(),
            'description' => $description,
        ]);
    }

    /**
     * Obtener historial de auditoría para un modelo específico
     */
    public function getModelAuditHistory(Model $model, int $limit = 50): array
    {
        $auditLogs = AuditLog::forModel($model)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return [
            'model_type' => get_class($model),
            'model_id' => $model->id,
            'total_events' => $auditLogs->count(),
            'audit_logs' => $auditLogs,
            'events_summary' => $auditLogs->groupBy('event')->map->count(),
        ];
    }

    /**
     * Obtener actividad de auditoría por usuario
     */
    public function getUserAuditActivity(
        User $user,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null,
        int $limit = 100
    ): array {
        $query = AuditLog::byUser($user->id);

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        $auditLogs = $query->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return [
            'user' => $user,
            'period' => [
                'start_date' => $startDate?->format('Y-m-d H:i:s'),
                'end_date' => $endDate?->format('Y-m-d H:i:s'),
            ],
            'total_activities' => $auditLogs->count(),
            'audit_logs' => $auditLogs,
            'activity_summary' => [
                'by_event' => $auditLogs->groupBy('event')->map->count(),
                'by_model' => $auditLogs->groupBy('auditable_type')->map->count(),
                'by_date' => $auditLogs->groupBy(function($log) {
                    return $log->created_at->format('Y-m-d');
                })->map->count(),
            ]
        ];
    }

    /**
     * Obtener actividades sospechosas o críticas
     */
    public function getSuspiciousActivities(
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): array {
        $query = AuditLog::query();

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        // Actividades críticas: cancelaciones, cambios de diferencias, etc.
        $criticalEvents = ['cancelled', 'closed', 'deleted'];
        $criticalActivities = $query->clone()
            ->whereIn('event', $criticalEvents)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        // Actividades fuera de horario (ejemplo: después de las 22:00 o antes de las 6:00)
        $offHoursActivities = $query->clone()
            ->where(function($q) {
                $q->whereTime('created_at', '<', '06:00:00')
                  ->orWhereTime('created_at', '>', '22:00:00');
            })
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        // Múltiples intentos de cancelación del mismo usuario
        $frequentCancellations = AuditLog::where('event', 'cancelled')
            ->when($startDate, fn($q) => $q->where('created_at', '>=', $startDate))
            ->when($endDate, fn($q) => $q->where('created_at', '<=', $endDate))
            ->select('user_id', DB::raw('count(*) as cancellation_count'))
            ->groupBy('user_id')
            ->having('cancellation_count', '>', 3)
            ->with('user')
            ->get();

        return [
            'critical_activities' => $criticalActivities,
            'off_hours_activities' => $offHoursActivities,
            'frequent_cancellations' => $frequentCancellations,
            'summary' => [
                'total_critical' => $criticalActivities->count(),
                'total_off_hours' => $offHoursActivities->count(),
                'users_with_frequent_cancellations' => $frequentCancellations->count(),
            ]
        ];
    }

    /**
     * Generar reporte de auditoría de sesiones de caja
     */
    public function getCashRegisterAuditReport(
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): array {
        $query = AuditLog::where('auditable_type', CashRegisterSession::class);

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        $auditLogs = $query->with(['user'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Sesiones con diferencias significativas
        $sessionsWithDifferences = CashRegisterSession::where('status', 'closed')
            ->whereNotNull('difference')
            ->where(function($q) {
                $q->where('difference', '>', 10)
                  ->orWhere('difference', '<', -10);
            })
            ->when($startDate, fn($q) => $q->where('closing_date', '>=', $startDate))
            ->when($endDate, fn($q) => $q->where('closing_date', '<=', $endDate))
            ->with(['user', 'authorizedBy'])
            ->get();

        return [
            'period' => [
                'start_date' => $startDate?->format('Y-m-d'),
                'end_date' => $endDate?->format('Y-m-d'),
            ],
            'audit_logs' => $auditLogs,
            'sessions_with_differences' => $sessionsWithDifferences,
            'summary' => [
                'total_events' => $auditLogs->count(),
                'sessions_opened' => $auditLogs->where('event', 'opened')->count(),
                'sessions_closed' => $auditLogs->where('event', 'closed')->count(),
                'total_differences' => $sessionsWithDifferences->count(),
                'average_difference' => $sessionsWithDifferences->avg('difference') ?? 0,
                'max_difference' => $sessionsWithDifferences->max('difference') ?? 0,
                'min_difference' => $sessionsWithDifferences->min('difference') ?? 0,
            ],
            'events_by_user' => $auditLogs->groupBy('user_id')->map(function($logs) {
                return [
                    'user' => $logs->first()->user,
                    'events_count' => $logs->count(),
                    'events_by_type' => $logs->groupBy('event')->map->count(),
                ];
            }),
        ];
    }

    /**
     * Generar reporte de auditoría de transacciones
     */
    public function getTransactionAuditReport(
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): array {
        $query = AuditLog::where('auditable_type', Transaction::class);

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        $auditLogs = $query->with(['user'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Transacciones canceladas
        $cancelledTransactions = $auditLogs->where('event', 'cancelled');

        // Transacciones por montos altos (ejemplo: > $5000)
        $highAmountTransactions = Transaction::where('amount', '>', 5000)
            ->where('status', 'active')
            ->when($startDate, fn($q) => $q->where('created_at', '>=', $startDate))
            ->when($endDate, fn($q) => $q->where('created_at', '<=', $endDate))
            ->with(['user', 'cashRegisterSession'])
            ->get();

        return [
            'period' => [
                'start_date' => $startDate?->format('Y-m-d'),
                'end_date' => $endDate?->format('Y-m-d'),
            ],
            'audit_logs' => $auditLogs,
            'cancelled_transactions' => $cancelledTransactions,
            'high_amount_transactions' => $highAmountTransactions,
            'summary' => [
                'total_events' => $auditLogs->count(),
                'transactions_created' => $auditLogs->where('event', 'created')->count(),
                'transactions_cancelled' => $cancelledTransactions->count(),
                'high_amount_count' => $highAmountTransactions->count(),
                'cancellation_rate' => $auditLogs->count() > 0 
                    ? ($cancelledTransactions->count() / $auditLogs->where('event', 'created')->count()) * 100 
                    : 0,
            ],
            'cancellations_by_user' => $cancelledTransactions->groupBy('user_id')->map(function($logs) {
                return [
                    'user' => $logs->first()->user,
                    'cancellations_count' => $logs->count(),
                ];
            }),
        ];
    }

    /**
     * Limpiar logs de auditoría antiguos
     */
    public function cleanupOldAuditLogs(int $daysToKeep = 365): int
    {
        $cutoffDate = Carbon::now()->subDays($daysToKeep);
        
        return AuditLog::where('created_at', '<', $cutoffDate)->delete();
    }

    /**
     * Exportar logs de auditoría a array para reportes
     */
    public function exportAuditLogs(
        ?Carbon $startDate = null,
        ?Carbon $endDate = null,
        ?array $filters = []
    ): array {
        $query = AuditLog::with('user');

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        if (isset($filters['event'])) {
            $query->where('event', $filters['event']);
        }

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['auditable_type'])) {
            $query->where('auditable_type', $filters['auditable_type']);
        }

        return $query->orderBy('created_at', 'desc')
            ->get()
            ->map(function($log) {
                return [
                    'id' => $log->id,
                    'event' => $log->event,
                    'model_type' => $log->auditable_type,
                    'model_id' => $log->auditable_id,
                    'user_name' => $log->user?->name ?? 'Sistema',
                    'user_email' => $log->user?->email ?? 'N/A',
                    'description' => $log->description,
                    'ip_address' => $log->ip_address,
                    'user_agent' => $log->user_agent,
                    'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                    'changes' => $log->getChangedFields(),
                ];
            })
            ->toArray();
    }

    /**
     * Obtener logs de auditoría con filtros
     */
    public function getAuditLogs(array $filters = [], int $perPage = 20): array
    {
        $query = AuditLog::with('user')->orderBy('created_at', 'desc');

        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }
        if (isset($filters['event'])) {
            $query->where('event', $filters['event']);
        }
        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }
        if (isset($filters['auditable_type'])) {
            $query->where('auditable_type', $filters['auditable_type']);
        }

        $auditLogs = $query->paginate($perPage);

        return [
            'audit_logs' => $auditLogs->items(),
            'pagination' => [
                'current_page' => $auditLogs->currentPage(),
                'last_page' => $auditLogs->lastPage(),
                'per_page' => $auditLogs->perPage(),
                'total' => $auditLogs->total()
            ]
        ];
    }

    /**
     * Generar reporte de actividad por usuario
     */
    public function getUserActivityReport(
        int $userId,
        string $dateFrom,
        string $dateTo,
        bool $includeDetails = false
    ): array {
        $user = User::findOrFail($userId);
        
        $query = AuditLog::where('user_id', $userId)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->orderBy('created_at', 'desc');

        if ($includeDetails) {
            $activities = $query->get();
        } else {
            $activities = $query->select(['event', 'auditable_type', 'created_at', 'description'])->get();
        }

        // Agrupar por tipo de evento
        $eventGroups = $activities->groupBy('event');
        $eventSummary = $eventGroups->map(function ($events) {
            return [
                'count' => $events->count(),
                'latest' => $events->first()->created_at
            ];
        });

        // Agrupar por día
        $dailyActivity = $activities->groupBy(function ($item) {
            return $item->created_at->format('Y-m-d');
        })->map(function ($dayActivities) {
            return $dayActivities->count();
        });

        return [
            'user' => $user,
            'period' => ['from' => $dateFrom, 'to' => $dateTo],
            'summary' => [
                'total_activities' => $activities->count(),
                'unique_events' => $eventGroups->count(),
                'events_breakdown' => $eventSummary,
                'daily_activity' => $dailyActivity
            ],
            'activities' => $includeDetails ? $activities : null
        ];
    }

    /**
     * Obtener resumen de actividad del sistema
     */
    public function getSystemActivitySummary(
        string $period = 'today',
        ?string $dateFrom = null,
        ?string $dateTo = null
    ): array {
        $query = AuditLog::query();

        switch ($period) {
            case 'today':
                $query->whereDate('created_at', today());
                break;
            case 'week':
                $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                break;
            case 'month':
                $query->whereMonth('created_at', now()->month)
                      ->whereYear('created_at', now()->year);
                break;
            case 'year':
                $query->whereYear('created_at', now()->year);
                break;
        }

        if ($dateFrom && $dateTo) {
            $query->whereBetween('created_at', [$dateFrom, $dateTo]);
        }

        $totalActivities = $query->count();
        $uniqueUsers = $query->distinct('user_id')->count();
        
        // Eventos más comunes
        $topEvents = $query->select(['event', DB::raw('count(*) as count')])
            ->groupBy('event')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get();

        // Actividad por hora (últimas 24 horas)
        $hourlyActivity = AuditLog::where('created_at', '>=', now()->subDay())
            ->select([DB::raw('HOUR(created_at) as hour'), DB::raw('count(*) as count')])
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->pluck('count', 'hour');

        return [
            'period' => $period,
            'total_activities' => $totalActivities,
            'unique_users' => $uniqueUsers,
            'top_events' => $topEvents,
            'hourly_activity' => $hourlyActivity
        ];
    }

    /**
     * Buscar en logs de auditoría
     */
    public function searchAuditLogs(
        string $query,
        array $searchIn = ['description'],
        array $filters = [],
        int $limit = 50
    ): array {
        $auditQuery = AuditLog::with('user');

        // Construir la búsqueda
        $auditQuery->where(function ($q) use ($query, $searchIn) {
            foreach ($searchIn as $field) {
                if ($field === 'old_values' || $field === 'new_values') {
                    $q->orWhereRaw("JSON_SEARCH({$field}, 'one', ?) IS NOT NULL", ["%{$query}%"]);
                } else {
                    $q->orWhere($field, 'LIKE', "%{$query}%");
                }
            }
        });

        // Aplicar filtros adicionales
        if (isset($filters['date_from'])) {
            $auditQuery->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (isset($filters['date_to'])) {
            $auditQuery->whereDate('created_at', '<=', $filters['date_to']);
        }

        $results = $auditQuery->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return [
            'query' => $query,
            'search_fields' => $searchIn,
            'total_results' => $results->count(),
            'results' => $results
        ];
    }
}