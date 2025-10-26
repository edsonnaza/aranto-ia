<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use App\Models\Service;

class ServiceController extends Controller
{
    public function __construct(
        private AuditService $auditService
    ) {
    }

    /**
     * Obtener lista de servicios médicos disponibles
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'category' => 'nullable|string|max:100',
                'status' => 'nullable|in:active,inactive',
                'search' => 'nullable|string|max:255',
                'page' => 'integer|min:1',
                'per_page' => 'integer|min:5|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parámetros de consulta inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = Service::query();

            // Filtros opcionales
            if ($request->category) {
                $query->where('category', $request->category);
            }
            
            if ($request->status) {
                $query->where('status', $request->status);
            } else {
                // Por defecto solo mostrar servicios activos
                $query->where('status', 'active');
            }

            if ($request->search) {
                $query->where(function ($q) use ($request) {
                    $q->where('name', 'LIKE', "%{$request->search}%")
                      ->orWhere('description', 'LIKE', "%{$request->search}%")
                      ->orWhere('code', 'LIKE', "%{$request->search}%");
                });
            }

            $services = $query->orderBy('name')
                ->paginate($request->per_page ?? 20);

            // Obtener categorías disponibles
            $categories = Service::distinct('category')
                ->where('status', 'active')
                ->pluck('category')
                ->filter()
                ->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'services' => $services->items(),
                    'pagination' => [
                        'current_page' => $services->currentPage(),
                        'last_page' => $services->lastPage(),
                        'per_page' => $services->perPage(),
                        'total' => $services->total()
                    ],
                    'categories' => $categories,
                    'filters_applied' => [
                        'category' => $request->category,
                        'status' => $request->status ?? 'active',
                        'search' => $request->search
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener servicios: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener detalles de un servicio específico
     */
    public function show($serviceId): JsonResponse
    {
        try {
            $service = Service::findOrFail($serviceId);

            return response()->json([
                'success' => true,
                'data' => [
                    'service' => $service,
                    'permissions' => [
                        'can_edit' => Auth::user()->can('services.edit'),
                        'can_delete' => Auth::user()->can('services.delete'),
                        'can_process_payment' => Auth::user()->can('payments.process')
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener servicio: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nuevo servicio médico
     */
    public function store(Request $request): JsonResponse
    {
        try {
            if (!Auth::user()->can('services.create')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para crear servicios'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string|max:500',
                'code' => 'nullable|string|max:50|unique:services,code',
                'category' => 'nullable|string|max:100',
                'price' => 'required|numeric|min:0',
                'cost' => 'nullable|numeric|min:0',
                'duration_minutes' => 'nullable|integer|min:1',
                'requires_professional' => 'boolean',
                'status' => 'in:active,inactive'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos de validación incorrectos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $service = Service::create([
                'name' => $request->name,
                'description' => $request->description,
                'code' => $request->code,
                'category' => $request->category,
                'price' => $request->price,
                'cost' => $request->cost ?? 0,
                'duration_minutes' => $request->duration_minutes,
                'requires_professional' => $request->requires_professional ?? false,
                'status' => $request->status ?? 'active'
            ]);

            $this->auditService->logActivity(
                $service,
                'service_created',
                null,
                $service->toArray(),
                'Nuevo servicio médico creado'
            );

            return response()->json([
                'success' => true,
                'message' => 'Servicio creado correctamente',
                'data' => [
                    'service' => $service
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear servicio: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar servicio existente
     */
    public function update(Request $request, $serviceId): JsonResponse
    {
        try {
            if (!Auth::user()->can('services.edit')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para editar servicios'
                ], 403);
            }

            $service = Service::findOrFail($serviceId);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string|max:500',
                'code' => 'nullable|string|max:50|unique:services,code,' . $serviceId,
                'category' => 'nullable|string|max:100',
                'price' => 'required|numeric|min:0',
                'cost' => 'nullable|numeric|min:0',
                'duration_minutes' => 'nullable|integer|min:1',
                'requires_professional' => 'boolean',
                'status' => 'in:active,inactive'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos de validación incorrectos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $oldValues = $service->toArray();

            $service->update([
                'name' => $request->name,
                'description' => $request->description,
                'code' => $request->code,
                'category' => $request->category,
                'price' => $request->price,
                'cost' => $request->cost ?? 0,
                'duration_minutes' => $request->duration_minutes,
                'requires_professional' => $request->requires_professional ?? false,
                'status' => $request->status ?? 'active'
            ]);

            $this->auditService->logActivity(
                $service,
                'service_updated',
                $oldValues,
                $service->fresh()->toArray(),
                'Servicio médico actualizado'
            );

            return response()->json([
                'success' => true,
                'message' => 'Servicio actualizado correctamente',
                'data' => [
                    'service' => $service->fresh()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar servicio: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar servicio (cambiar status a inactive)
     */
    public function destroy($serviceId): JsonResponse
    {
        try {
            if (!Auth::user()->can('services.delete')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para eliminar servicios'
                ], 403);
            }

            $service = Service::findOrFail($serviceId);

            // No eliminamos físicamente, solo cambiamos el status
            $oldValues = $service->toArray();
            $service->update(['status' => 'inactive']);

            $this->auditService->logActivity(
                $service,
                'service_deactivated',
                $oldValues,
                $service->fresh()->toArray(),
                'Servicio médico desactivado'
            );

            return response()->json([
                'success' => true,
                'message' => 'Servicio desactivado correctamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar servicio: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reactivar servicio
     */
    public function activate($serviceId): JsonResponse
    {
        try {
            if (!Auth::user()->can('services.edit')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para reactivar servicios'
                ], 403);
            }

            $service = Service::findOrFail($serviceId);

            if ($service->status === 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'El servicio ya está activo'
                ], 400);
            }

            $oldValues = $service->toArray();
            $service->update(['status' => 'active']);

            $this->auditService->logActivity(
                $service,
                'service_activated',
                $oldValues,
                $service->fresh()->toArray(),
                'Servicio médico reactivado'
            );

            return response()->json([
                'success' => true,
                'message' => 'Servicio reactivado correctamente',
                'data' => [
                    'service' => $service->fresh()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al reactivar servicio: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de servicios
     */
    public function getStatistics(Request $request): JsonResponse
    {
        try {
            if (!Auth::user()->can('reports.services')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para ver estadísticas de servicios'
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

            $statistics = [
                'total_services' => Service::count(),
                'active_services' => Service::where('status', 'active')->count(),
                'inactive_services' => Service::where('status', 'inactive')->count(),
                'categories' => Service::distinct('category')->count('category'),
                'average_price' => Service::where('status', 'active')->avg('price'),
                'price_range' => [
                    'min' => Service::where('status', 'active')->min('price'),
                    'max' => Service::where('status', 'active')->max('price')
                ]
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
