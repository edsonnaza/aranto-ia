<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Services\AuditLogTransformer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    /**
     * Display a listing of audit logs.
     */
    public function index(Request $request): Response
    {
        // Verificar permiso
        if (!auth()->user()->can('access-audit-logs')) {
            abort(403, 'No tienes permiso para acceder a la auditoría.');
        }

        $query = AuditLog::with('user')
                         ->orderBy('created_at', 'desc');

        // Filtros - usar auditable_type en lugar de model_type
        if ($request->model_type) {
            $query->where('auditable_type', $request->model_type);
        }

        if ($request->event) {
            $query->where('event', $request->event);
        }

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $auditLogs = $query->paginate(25)->withQueryString();

        // Transformar manualmente sin usar el Resource en la paginación
        $transformer = new AuditLogTransformer();
        $data = $auditLogs->items();
        $transformedData = array_map(function ($log) use ($transformer) {
            return [
                'id' => $log->id,
                'entidad' => $log->model_type,
                'idEntidad' => $log->model_id,
                'evento' => $log->event,
                'usuarioId' => $log->user_id,
                'usuario' => $log->user ? [
                    'id' => $log->user->id,
                    'nombre' => $log->user->name,
                    'correo' => $log->user->email,
                ] : null,
                'valoresAnteriores' => $log->old_values ? $transformer->transform($log->old_values) : null,
                'valoresNuevos' => $log->new_values ? $transformer->transform($log->new_values) : null,
                'direccionIp' => $log->ip_address,
                'agenteUsuario' => $log->user_agent,
                'descripcion' => $log->description,
                'fechaHora' => $log->created_at,
            ];
        }, $data);

        $from = ($auditLogs->currentPage() - 1) * $auditLogs->perPage() + 1;
        $to = $from + count($transformedData) - 1;

        return Inertia::render('settings/audit/Index', [
            'auditLogs' => [
                'data' => $transformedData,
                'total' => $auditLogs->total(),
                'per_page' => $auditLogs->perPage(),
                'current_page' => $auditLogs->currentPage(),
                'last_page' => $auditLogs->lastPage(),
                'from' => $from,
                'to' => $to,
            ],
            'filters' => $request->only(['model_type', 'event', 'user_id', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Display the specified audit log detail.
     */
    public function show(AuditLog $auditLog): Response
    {
        // Verificar permiso
        if (!auth()->user()->can('access-audit-logs')) {
            abort(403, 'No tienes permiso para acceder a la auditoría.');
        }

        $auditLog->load('user');

        // Transformar manualmente
        $transformer = new AuditLogTransformer();
        $transformedLog = [
            'id' => $auditLog->id,
            'entidad' => $auditLog->model_type,
            'idEntidad' => $auditLog->model_id,
            'evento' => $auditLog->event,
            'usuarioId' => $auditLog->user_id,
            'usuario' => $auditLog->user ? [
                'id' => $auditLog->user->id,
                'nombre' => $auditLog->user->name,
                'correo' => $auditLog->user->email,
            ] : null,
            'valoresAnteriores' => $auditLog->old_values ? $transformer->transform($auditLog->old_values) : null,
            'valoresNuevos' => $auditLog->new_values ? $transformer->transform($auditLog->new_values) : null,
            'direccionIp' => $auditLog->ip_address,
            'agenteUsuario' => $auditLog->user_agent,
            'descripcion' => $auditLog->description,
            'fechaHora' => $auditLog->created_at,
        ];

        return Inertia::render('settings/audit/Show', [
            'auditLog' => $transformedLog,
        ]);
    }

    /**
     * Delete old audit logs (cleanup).
     */
    public function cleanup(Request $request)
    {
        // Verificar permiso
        if (!auth()->user()->can('access-audit-logs')) {
            abort(403, 'No tienes permiso para acceder a la auditoría.');
        }

        $days = $request->input('days', 90);
        
        AuditLog::where('created_at', '<', now()->subDays($days))->delete();

        return redirect()
            ->back()
            ->with('message', "Se eliminaron registros de auditoría anteriores a {$days} días.");
    }
}
