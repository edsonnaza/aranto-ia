<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Exceptions\UnauthorizedException;

class HandlePermissionDenied
{
    public function handle(Request $request, Closure $next)
    {
        try {
            return $next($request);
        } catch (UnauthorizedException $e) {
            // Si es una solicitud Inertia, devolver error con Inertia
            if ($request->inertia()) {
                return Inertia::render('Error', [
                    'status' => 403,
                    'message' => 'No tienes permiso para acceder a este recurso.'
                ])->toResponse($request)->setStatusCode(403);
            }
            
            throw $e;
        }
    }
}
