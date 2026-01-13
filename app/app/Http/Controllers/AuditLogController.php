<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
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
        $query = AuditLog::with('user')
                         ->orderBy('created_at', 'desc');

        // Filtros
        if ($request->model_type) {
            $query->where('model_type', $request->model_type);
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

        return Inertia::render('settings/audit/Index', [
            'auditLogs' => $auditLogs,
            'filters' => $request->only(['model_type', 'event', 'user_id', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Display the specified audit log detail.
     */
    public function show(AuditLog $auditLog): Response
    {
        $auditLog->load('user');

        return Inertia::render('settings/audit/Show', [
            'auditLog' => $auditLog,
        ]);
    }

    /**
     * Delete old audit logs (cleanup).
     */
    public function cleanup(Request $request)
    {
        $days = $request->input('days', 90);
        
        AuditLog::where('created_at', '<', now()->subDays($days))->delete();

        return redirect()
            ->back()
            ->with('message', "Se eliminaron registros de auditoría anteriores a {$days} días.");
    }
}
