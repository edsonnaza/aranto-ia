<?php

namespace App\Http\Controllers;

use App\Models\CommissionLiquidation;
use App\Models\AuditLog;
use App\Models\ServiceRequest;
use App\Services\CommissionService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CommissionController
 *
 * Handles commission liquidation management through Inertia.js views
 */
class CommissionController extends Controller
{
    public function __construct(
        private CommissionService $commissionService
    ) {}

    /**
     * Tabs válidos para la página índice de comisiones.
     *
     * @var array<int, string>
     */
    private const INDEX_TABS = [
        'dashboard',
        'create',
        'list',
        'authorizations',
        'reports',
        'approvals',
        'settings',
        'details',
    ];

    /**
     * Display a listing of commission liquidations.
     */
    public function index(Request $request): Response
    {
        $indexUiState = $this->resolveIndexUiState($request);
        $activeTab = $indexUiState['activeTab'];
        $dateFrom = $indexUiState['dateFrom'];
        $dateTo = $indexUiState['dateTo'];

        $liquidations = $this->getLiquidationsForIndex($request, $dateFrom, $dateTo);
        $pendingApprovals = $this->getPendingApprovalsForIndex();
        $professionals = $this->getProfessionalsForIndex();
        $authorizationData = $this->getScheduledConsultationsForAuthorization($request);
        $filters = $this->getCommissionIndexFilters($request, $dateFrom, $dateTo);
        $selectionState = $this->resolveIndexSelectionState($request);

        return Inertia::render('commission/Index', [
            'professionals' => $professionals,
            'liquidations' => $liquidations,
            'pendingApprovals' => $pendingApprovals,
            'filters' => $filters,
            'initialTab' => $activeTab,
            'selectedLiquidationId' => $selectionState['selectedLiquidationId'],
            'editingLiquidationId' => $selectionState['editingLiquidationId'],
            'createProfessionalId' => $selectionState['createProfessionalId'],
            'professionalsWithPendingCommissions' => $this->getProfessionalsWithPendingCommissions(),
            'scheduledConsultations' => $authorizationData['consultations'],
            'authorizationFilters' => $authorizationData['filters'],
        ]);
    }

    /**
     * Resuelve el estado principal de la UI para el índice.
     *
     * @return array{activeTab: string, dateFrom: string, dateTo: string}
     */
    private function resolveIndexUiState(Request $request): array
    {
        $requestedTab = (string) $request->query('tab', 'dashboard');
        $activeTab = in_array($requestedTab, self::INDEX_TABS, true) ? $requestedTab : 'dashboard';

        return [
            'activeTab' => $activeTab,
            'dateFrom' => $request->filled('date_from') ? (string) $request->query('date_from') : now()->toDateString(),
            'dateTo' => $request->filled('date_to') ? (string) $request->query('date_to') : now()->toDateString(),
        ];
    }

    /**
     * Resuelve IDs opcionales usados por la UI del índice.
     *
     * @return array{selectedLiquidationId: int|null, editingLiquidationId: int|null, createProfessionalId: int|null}
     */
    private function resolveIndexSelectionState(Request $request): array
    {
        return [
            'selectedLiquidationId' => $request->filled('liquidation_id') ? (int) $request->query('liquidation_id') : null,
            'editingLiquidationId' => $request->filled('edit_liquidation_id') ? (int) $request->query('edit_liquidation_id') : null,
            'createProfessionalId' => $request->filled('create_professional_id') ? (int) $request->query('create_professional_id') : null,
        ];
    }

    /**
     * Listar consultas/citas agendadas para autorización de comisión.
     *
     * @return array{consultations: \Illuminate\Contracts\Pagination\LengthAwarePaginator, filters: array<string, string|null>}
     */
    private function getScheduledConsultationsForAuthorization(Request $request): array
    {
        $dateFrom = $request->filled('authorization_date_from')
            ? (string) $request->query('authorization_date_from')
            : now()->toDateString();

        $dateTo = $request->filled('authorization_date_to')
            ? (string) $request->query('authorization_date_to')
            : now()->toDateString();

        $professionalId = $request->filled('authorization_professional_id')
            ? (int) $request->query('authorization_professional_id')
            : null;

        $consultationsQuery = ServiceRequest::query()
            ->with([
                'patient:id,first_name,last_name,document_number',
                'details:id,service_request_id,medical_service_id,professional_id,scheduled_date',
                'details.medicalService:id,name',
                'details.professional:id,first_name,last_name',
                'commissionAuthorizedBy:id,name',
            ])
            ->where('reception_type', ServiceRequest::RECEPTION_SCHEDULED)
            ->whereHas('details', function ($query) use ($dateFrom, $dateTo) {
                $query
                    ->whereNotNull('scheduled_date')
                    ->whereDate('scheduled_date', '>=', $dateFrom)
                    ->whereDate('scheduled_date', '<=', $dateTo);
            })
            ->when($professionalId, function ($query, $professionalId) {
                $query->whereHas('details', function ($detailQuery) use ($professionalId) {
                    $detailQuery->where('professional_id', $professionalId);
                });
            })
            ->withExists([
                'transactions as has_liquidation' => function ($query) {
                    $query->whereNotNull('commission_liquidation_id');
                }
            ])
            ->orderByDesc('request_date')
            ->orderByDesc('id');

        $consultations = $consultationsQuery
            ->paginate(20)
            ->through(function (ServiceRequest $serviceRequest) {
                $details = $serviceRequest->details;

                $scheduledDate = $details
                    ->pluck('scheduled_date')
                    ->filter()
                    ->sort()
                    ->first();

                $servicesSummary = $details
                    ->map(fn ($detail) => $detail->medicalService?->name)
                    ->filter()
                    ->unique()
                    ->implode(', ');

                $professionalSummary = $details
                    ->map(fn ($detail) => $detail->professional?->full_name)
                    ->filter()
                    ->unique()
                    ->implode(', ');

                $totalAmount = (float) $serviceRequest->total_amount;
                $paidAmount = (float) $serviceRequest->paid_amount;
                $remainingAmount = max(0, round($totalAmount - $paidAmount, 2));
                $hasPendingBalance = $remainingAmount > 0.0001 || $serviceRequest->payment_status !== ServiceRequest::PAYMENT_PAID;
                $isAuthorized = !is_null($serviceRequest->commission_authorized_at);
                $isLiquidated = (bool) ($serviceRequest->has_liquidation ?? false);

                return [
                    'id' => $serviceRequest->id,
                    'request_number' => $serviceRequest->request_number,
                    'patient_name' => $serviceRequest->patient?->full_name ?? 'Paciente sin nombre',
                    'patient_document' => $serviceRequest->patient?->document_number,
                    'professional_name' => $professionalSummary,
                    'request_date' => $serviceRequest->request_date?->format('Y-m-d'),
                    'scheduled_date' => $scheduledDate?->format('Y-m-d'),
                    'services_summary' => $servicesSummary,
                    'total_amount' => $totalAmount,
                    'paid_amount' => $paidAmount,
                    'remaining_amount' => $remainingAmount,
                    'has_pending_balance' => $hasPendingBalance,
                    'is_authorized' => $isAuthorized,
                    'is_liquidated' => $isLiquidated,
                    'authorized_at' => $serviceRequest->commission_authorized_at?->format('Y-m-d H:i:s'),
                    'authorized_by_name' => $serviceRequest->commissionAuthorizedBy?->name,
                    'can_authorize' => !$hasPendingBalance && !$isAuthorized,
                    'can_deauthorize' => $isAuthorized && !$isLiquidated,
                ];
            })
            ->withQueryString();

        return [
            'consultations' => $consultations,
            'filters' => [
                'authorization_date_from' => $dateFrom,
                'authorization_date_to' => $dateTo,
                'authorization_professional_id' => $professionalId ? (string) $professionalId : null,
            ],
        ];
    }

    /**
     * Obtener liquidaciones para el índice de comisiones.
     *
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    private function getLiquidationsForIndex(Request $request, string $dateFrom, string $dateTo)
    {
        $query = CommissionLiquidation::with(['professional.specialties', 'generatedBy', 'approvedBy'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('professional_id')) {
            $query->where('professional_id', $request->professional_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $query->whereDate('created_at', '>=', $dateFrom);
        $query->whereDate('created_at', '<=', $dateTo);

        return $query->paginate(20)->through(function (CommissionLiquidation $liquidation) {
            $specialty = $liquidation->professional->specialties->where('pivot.is_primary', true)->first();

            return [
                'id' => $liquidation->id,
                'professional_id' => $liquidation->professional_id,
                'professional_name' => $liquidation->professional->full_name ?? 'N/A',
                'specialty_name' => $specialty?->name ?? 'Sin especialidad',
                'period_start' => $liquidation->period_start,
                'period_end' => $liquidation->period_end,
                'total_services' => $liquidation->total_services,
                'total_amount' => $liquidation->gross_amount,
                'commission_percentage' => $liquidation->commission_percentage,
                'commission_amount' => $liquidation->commission_amount,
                'created_at' => $liquidation->created_at->toDateString(),
                'status' => $liquidation->status,
            ];
        });
    }

    /**
     * Obtener aprobaciones pendientes para el índice.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getPendingApprovalsForIndex(): array
    {
        return CommissionLiquidation::with(['professional.specialties'])
            ->where('status', CommissionLiquidation::STATUS_DRAFT)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function (CommissionLiquidation $liquidation) {
                $specialty = $liquidation->professional->specialties->where('pivot.is_primary', true)->first();

                return [
                    'id' => $liquidation->id,
                    'professional_id' => $liquidation->professional_id,
                    'professional_name' => $liquidation->professional->full_name ?? 'N/A',
                    'specialty_name' => $specialty?->name ?? 'Sin especialidad',
                    'period_start' => $liquidation->period_start,
                    'period_end' => $liquidation->period_end,
                    'total_services' => $liquidation->total_services,
                    'total_amount' => $liquidation->gross_amount,
                    'commission_percentage' => $liquidation->commission_percentage,
                    'commission_amount' => $liquidation->commission_amount,
                    'created_at' => $liquidation->created_at->toDateString(),
                    'status' => $liquidation->status,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Obtener profesionales activos para el índice.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getProfessionalsForIndex(): array
    {
        return \App\Models\Professional::where('status', 'active')
            ->with('specialties', 'commissionSettings')
            ->select(
                'id',
                'first_name',
                'last_name',
                'email',
                'phone',
                'license_number',
                'commission_percentage',
                'status',
                'created_at',
                'updated_at'
            )
            ->orderBy('last_name')
            ->get()
            ->map(function (\App\Models\Professional $prof) {
                return [
                    'id' => $prof->id,
                    'first_name' => $prof->first_name,
                    'last_name' => $prof->last_name,
                    'email' => $prof->email,
                    'phone' => $prof->phone,
                    'license_number' => $prof->license_number,
                    'commission_percentage' => $prof->commissionSettings?->commission_percentage ?? $prof->commission_percentage ?? 0,
                    'is_active' => $prof->status === 'active',
                    'status' => $prof->status,
                    'specialties' => $prof->specialties
                        ->map(fn ($specialty) => [
                            'id' => $specialty->id,
                            'name' => $specialty->name,
                        ])
                        ->values()
                        ->all(),
                    'created_at' => $prof->created_at?->toDateTimeString(),
                    'updated_at' => $prof->updated_at?->toDateTimeString(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Armar filtros del índice con formato de salida esperado.
     *
     * @return array<string, mixed>
     */
    private function getCommissionIndexFilters(Request $request, string $dateFrom, string $dateTo): array
    {
        return [
            'professional_id' => $request->professional_id,
            'status' => $request->status,
            'date_from' => \Carbon\Carbon::parse($dateFrom)->format('d-m-Y'),
            'date_to' => \Carbon\Carbon::parse($dateTo)->format('d-m-Y'),
        ];
    }

    /**
     * Autorizar en masa todas las consultas agendadas del filtro actual.
     */
    public function bulkAuthorizeScheduledConsultations(Request $request): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || !$user->can('access-financial') || !$user->can('access-commissions')) {
            return back()->withErrors(['general' => ['No tiene permisos para autorizar consultas en masa.']]);
        }

        $dateFrom = $request->filled('authorization_date_from')
            ? (string) $request->input('authorization_date_from')
            : now()->toDateString();

        $dateTo = $request->filled('authorization_date_to')
            ? (string) $request->input('authorization_date_to')
            : now()->toDateString();

        $professionalId = $request->filled('authorization_professional_id')
            ? (int) $request->input('authorization_professional_id')
            : null;

        /** @var \Illuminate\Database\Eloquent\Collection<int, ServiceRequest> $consultations */
        $consultations = ServiceRequest::query()
            ->where('reception_type', ServiceRequest::RECEPTION_SCHEDULED)
            ->whereNull('commission_authorized_at')
            ->whereHas('details', function ($query) use ($dateFrom, $dateTo) {
                $query
                    ->whereNotNull('scheduled_date')
                    ->whereDate('scheduled_date', '>=', $dateFrom)
                    ->whereDate('scheduled_date', '<=', $dateTo);
            })
            ->when($professionalId, function ($query, $professionalId) {
                $query->whereHas('details', function ($detailQuery) use ($professionalId) {
                    $detailQuery->where('professional_id', $professionalId);
                });
            })
            ->whereRaw('ROUND(total_amount - paid_amount, 2) <= 0')
            ->where('payment_status', ServiceRequest::PAYMENT_PAID)
            ->get();

        if ($consultations->isEmpty()) {
            return back()->withErrors(['general' => ['No hay consultas pendientes de autorización en el filtro seleccionado.']]);
        }

        $authorized = 0;

        DB::transaction(function () use ($consultations, &$authorized) {
            foreach ($consultations as $serviceRequest) {
                /** @var ServiceRequest $serviceRequest */

                $oldValues = [
                    'commission_authorized_at' => $serviceRequest->commission_authorized_at,
                    'commission_authorized_by' => $serviceRequest->commission_authorized_by,
                ];

                $serviceRequest->update([
                    'commission_authorized_at' => now(),
                    'commission_authorized_by' => auth()->id(),
                ]);

                $serviceRequest->refresh();

                AuditLog::logActivity(
                    $serviceRequest,
                    'commission_authorized',
                    $oldValues,
                    [
                        'commission_authorized_at' => $serviceRequest->commission_authorized_at?->toDateTimeString(),
                        'commission_authorized_by' => $serviceRequest->commission_authorized_by,
                    ],
                    'Consulta autorizada en masa para liquidación de comisiones'
                );

                $authorized++;
            }
        });

        return back()->with('success', "Se autorizaron {$authorized} consultas correctamente.");
    }

    /**
     * Autorizar una consulta agendada para liquidación de comisiones.
     */
    public function authorizeScheduledConsultation(Request $request, ServiceRequest $serviceRequest): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || !$user->can('access-financial') || !$user->can('access-commissions')) {
            return back()->withErrors(['general' => ['No tiene permisos para autorizar consultas para liquidación.']]);
        }

        $validated = $request->validate([
            'authorized' => ['required', 'boolean'],
        ]);

        $shouldAuthorize = (bool) $validated['authorized'];

        if ($serviceRequest->reception_type !== ServiceRequest::RECEPTION_SCHEDULED) {
            return back()->withErrors(['general' => ['Solo se pueden autorizar consultas agendadas.']]);
        }

        $remainingAmount = round((float) $serviceRequest->total_amount - (float) $serviceRequest->paid_amount, 2);
        if ($serviceRequest->payment_status !== ServiceRequest::PAYMENT_PAID || $remainingAmount > 0) {
            return back()->withErrors(['general' => ['No se puede autorizar una consulta con saldo pendiente.']]);
        }

        $isAuthorized = !is_null($serviceRequest->commission_authorized_at);

        if ($shouldAuthorize && $isAuthorized) {
            return back()->withErrors(['general' => ['Esta consulta ya fue autorizada previamente.']]);
        }

        if (!$shouldAuthorize && !$isAuthorized) {
            return back()->withErrors(['general' => ['La consulta ya se encuentra desautorizada.']]);
        }

        $hasLiquidation = $serviceRequest->transactions()
            ->whereNotNull('commission_liquidation_id')
            ->exists();

        if (!$shouldAuthorize && $hasLiquidation) {
            return back()->withErrors(['general' => ['No se puede desautorizar una consulta que ya fue liquidada.']]);
        }

        DB::transaction(function () use ($serviceRequest, $shouldAuthorize) {
            $oldValues = [
                'commission_authorized_at' => $serviceRequest->commission_authorized_at,
                'commission_authorized_by' => $serviceRequest->commission_authorized_by,
                'payment_status' => $serviceRequest->payment_status,
                'remaining_amount' => round((float) $serviceRequest->total_amount - (float) $serviceRequest->paid_amount, 2),
            ];

            $serviceRequest->update([
                'commission_authorized_at' => $shouldAuthorize ? now() : null,
                'commission_authorized_by' => $shouldAuthorize ? auth()->id() : null,
            ]);

            $serviceRequest->refresh();

            AuditLog::logActivity(
                $serviceRequest,
                $shouldAuthorize ? 'commission_authorized' : 'commission_deauthorized',
                $oldValues,
                [
                    'commission_authorized_at' => $serviceRequest->commission_authorized_at?->toDateTimeString(),
                    'commission_authorized_by' => $serviceRequest->commission_authorized_by,
                    'payment_status' => $serviceRequest->payment_status,
                    'remaining_amount' => round((float) $serviceRequest->total_amount - (float) $serviceRequest->paid_amount, 2),
                ],
                $shouldAuthorize
                    ? 'Consulta autorizada para liquidación de comisiones'
                    : 'Consulta desautorizada para liquidación de comisiones'
            );
        });

        return back()->with('success', $shouldAuthorize
            ? 'Consulta autorizada para liquidación de comisiones.'
            : 'Consulta desautorizada para liquidación de comisiones.');
    }

    /**
     * Get professionals with pending commissions to display in dashboard
     */
    private function getProfessionalsWithPendingCommissions(): array
    {
        $professionals = \App\Models\Professional::where('status', 'active')
            ->with('specialties', 'commissionSettings')
            ->get()
            ->map(function ($professional) {
                // Get transaction movements that have not been liquidated yet
                $pendingMovements = \App\Models\Transaction::where('professional_id', $professional->id)
                    ->where('type', 'INCOME')
                    ->where('category', 'SERVICE_PAYMENT')
                    ->where('status', 'active')
                    ->whereNull('commission_liquidation_id')
                    ->whereHas('serviceRequest', function ($query) {
                        $query
                            ->where('reception_type', ServiceRequest::RECEPTION_SCHEDULED)
                            ->where('payment_status', ServiceRequest::PAYMENT_PAID)
                            ->whereNotNull('commission_authorized_at');
                    })
                    ->get();

                $pendingCount = $pendingMovements->count();
                $pendingAmount = $pendingMovements->sum('amount');
                
                // Get commission percentage from commissionSettings, fallback to professional.commission_percentage
                $commissionPercentage = $professional->commissionSettings?->commission_percentage ?? $professional->commission_percentage ?? 0;

                return [
                    'id' => $professional->id,
                    'full_name' => $professional->full_name,
                    'first_name' => $professional->first_name,
                    'last_name' => $professional->last_name,
                    'specialty' => $professional->specialties->first()?->name ?? 'Sin especialidad',
                    'commission_percentage' => $commissionPercentage,
                    'pending_services_count' => $pendingCount,
                    'pending_amount' => $pendingAmount,
                    'commission_amount' => round(($pendingAmount * $commissionPercentage) / 100, 2),
                ];
            })
            ->filter(function ($professional) {
                return $professional['pending_services_count'] > 0;
            })
            ->sortByDesc('pending_amount')
            ->values()
            ->toArray();

        return $professionals;
    }

    /**
     * Get top professionals with fully paid services pending commission liquidation
     * Only includes services where 100% has been paid
     */
    public function getTopProfessionalsWithCommissions(Request $request): \Illuminate\Http\JsonResponse
    {
        $limit = (int)$request->query('limit', 10);

        $professionals = \App\Models\Professional::where('status', 'active')
            ->with('specialties', 'commissionSettings')
            ->get()
            ->flatMap(function ($professional) {
                // Get transaction movements that have not been liquidated yet
                $pendingMovements = \App\Models\Transaction::where('professional_id', $professional->id)
                    ->where('type', 'INCOME')
                    ->where('category', 'SERVICE_PAYMENT')
                    ->where('status', 'active')
                    ->whereNull('commission_liquidation_id')
                    ->whereHas('serviceRequest', function ($query) {
                        $query
                            ->where('payment_status', ServiceRequest::PAYMENT_PAID)
                            ->where(function ($eligibilityQuery) {
                                $eligibilityQuery
                                    ->where(function ($scheduledQuery) {
                                        $scheduledQuery
                                            ->where('reception_type', ServiceRequest::RECEPTION_SCHEDULED)
                                            ->whereNotNull('commission_authorized_at');
                                    })
                                    ->orWhere('reception_type', '!=', ServiceRequest::RECEPTION_SCHEDULED);
                            });
                    })
                    ->with('serviceRequest:id,reception_type')
                    ->get();

                if ($pendingMovements->isEmpty()) {
                    return collect();
                }
                
                // Get commission percentage from commissionSettings, fallback to professional.commission_percentage
                $commissionPercentage = $professional->commissionSettings?->commission_percentage ?? $professional->commission_percentage ?? 0;

                $groupedMovements = $pendingMovements->groupBy(function ($movement) {
                    $receptionType = $movement->serviceRequest?->reception_type;
                    return $receptionType === ServiceRequest::RECEPTION_SCHEDULED
                        ? 'scheduled'
                        : 'without_schedule';
                });

                return $groupedMovements->map(function ($movements, $groupKey) use ($professional, $commissionPercentage) {
                    $pendingCount = $movements->count();
                    $pendingAmount = $movements->sum('amount');

                    $dates = $movements->pluck('created_at')->map(function ($date) {
                        return \Carbon\Carbon::parse($date);
                    });

                    $periodStart = $dates->min()?->toDateString();
                    $periodEnd = $dates->max()?->toDateString();

                    return [
                        'id' => $professional->id,
                        'group_key' => sprintf('%d-%s', $professional->id, $groupKey),
                        'reception_group' => $groupKey,
                        'reception_label' => $groupKey === 'scheduled' ? 'Consulta agendada' : 'Sin agenda',
                        'full_name' => $professional->full_name,
                        'specialty' => $professional->specialties->first()?->name ?? 'Sin especialidad',
                        'commission_percentage' => $commissionPercentage,
                        'pending_services_count' => $pendingCount,
                        'pending_amount' => $pendingAmount,
                        'commission_amount' => round(($pendingAmount * $commissionPercentage) / 100, 2),
                        'period_start' => $periodStart,
                        'period_end' => $periodEnd,
                    ];
                })->values();
            })
            ->sortByDesc('commission_amount')
            ->take($limit)
            ->values()
            ->toArray();

        return response()->json([
            'professionals' => $professionals,
            'count' => count($professionals)
        ]);
    }

    /**
     * Show the form for creating a new commission liquidation.
     */
    public function create(Request $request): RedirectResponse
    {
        return redirect()->route('medical.commissions.index', array_filter([
            'tab' => 'create',
            'create_professional_id' => $request->query('professional_id'),
        ], static fn ($value) => $value !== null));
    }

    /**
     * Store a newly created commission liquidation.
     */
    public function store(Request $request): RedirectResponse
    {

        $request->validate([
            'professional_id' => 'required|exists:professionals,id',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'service_request_ids' => 'required|array|min:1',
            'service_request_ids.*' => 'integer',
        ]);

        // Validate that selected services are not already liquidated
        $alreadyLiquidated = $this->commissionService->getAlreadyLiquidatedServices(
            $request->service_request_ids
        );

        if (!empty($alreadyLiquidated)) {
            return back()->withErrors(['general' => ['Algunos servicios ya han sido liquidados previamente.']]);
        }

        try {
            $liquidation = $this->commissionService->generateLiquidation(
                $request->professional_id,
                $request->period_start,
                $request->period_end,
                auth()->id(),
                $request->service_request_ids
            );

            return redirect()->route('medical.commissions.index')
                ->with('success', 'Liquidación de comisiones generada exitosamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => [$e->getMessage()]]);
        }
    }

    /**
     * Display the specified commission liquidation.
     */
    public function show(CommissionLiquidation $commission): RedirectResponse
    {
        return redirect()->route('medical.commissions.index', [
            'tab' => 'details',
            'liquidation_id' => $commission->id,
        ]);
    }

    /**
     * Show the form for editing the specified commission liquidation.
     */
    public function edit(CommissionLiquidation $commission): RedirectResponse
    {
        // Only draft liquidations can be edited
        if (!$commission->isDraft()) {
            abort(403, 'Solo se pueden editar liquidaciones en estado borrador.');
        }

        return redirect()->route('medical.commissions.index', [
            'tab' => 'create',
            'edit_liquidation_id' => $commission->id,
        ]);
    }

    /**
     * Update the specified commission liquidation.
     */
    public function update(Request $request, CommissionLiquidation $commission): RedirectResponse
    {
        \Log::info('CommissionController update called with request', [
            'request_data' => $request->all(),
            'route_param_liquidation_id' => $commission->id ?? 'null',
            'liquidation_object' => $commission->toArray(),
        ]);
        
        \Log::debug('CommissionController update - liquidation object', [
            'liquidation_id' => $commission->id,
            'status' => $commission->status,
            'isDraft' => $commission->isDraft(),
        ]);
        
        if (!$commission->isDraft()) {
            \Log::warning('Attempt to update non-draft liquidation', [
                'liquidation_id' => $commission->id,
                'status' => $commission->status,
            ]);
            return back()->withErrors(['general' => ["Solo se pueden actualizar liquidaciones en estado borrador. Estado actual: {$commission->status}"]]);
        }

        $request->validate([
            'period_start' => 'required|date_format:Y-m-d',
            'period_end' => 'required|date_format:Y-m-d|after_or_equal:period_start',
            'service_request_ids' => 'required|array|min:1',
            'service_request_ids.*' => 'required|integer|exists:service_requests,id',
        ]);

        try {
            $this->syncDraftCommissionLiquidation($commission, $request->period_start, $request->period_end, $request->service_request_ids);

            return redirect()->route('medical.commissions.index', [
                'tab' => 'details',
                'liquidation_id' => $commission->id,
            ])
                ->with('success', 'Liquidación actualizada exitosamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => [$e->getMessage()]]);
        }
    }

    /**
     * Sincroniza una liquidación borrador con los servicios seleccionados.
     *
     * @param array<int, int|string> $serviceRequestIds
     */
    private function syncDraftCommissionLiquidation(CommissionLiquidation $commission, string $periodStart, string $periodEnd, array $serviceRequestIds): void
    {
        $currentServiceRequestIds = $commission->details()
            ->pluck('service_request_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $selectedServiceRequestIds = collect($serviceRequestIds)
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $serviceRequestIdsToRemove = array_values(array_diff($currentServiceRequestIds, $selectedServiceRequestIds));
        $serviceRequestIdsToAdd = array_values(array_diff($selectedServiceRequestIds, $currentServiceRequestIds));

        DB::transaction(function () use ($commission, $periodStart, $periodEnd, $serviceRequestIdsToRemove, $serviceRequestIdsToAdd) {
            if (!empty($serviceRequestIdsToRemove)) {
                $this->removeCommissionDetails($commission, $serviceRequestIdsToRemove);
            }

            if (!empty($serviceRequestIdsToAdd)) {
                $this->addCommissionDetails($commission, $periodStart, $periodEnd, $serviceRequestIdsToAdd);
            }

            $this->refreshCommissionLiquidationTotals($commission, $periodStart, $periodEnd);
        });
    }

    /**
     * Elimina detalles de una liquidación y libera sus transacciones.
     *
     * @param array<int, int> $serviceRequestIdsToRemove
     */
    private function removeCommissionDetails(CommissionLiquidation $commission, array $serviceRequestIdsToRemove): void
    {
        $commission->details()
            ->whereIn('service_request_id', $serviceRequestIdsToRemove)
            ->delete();

        \App\Models\Transaction::where('commission_liquidation_id', $commission->id)
            ->whereIn('service_request_id', $serviceRequestIdsToRemove)
            ->update(['commission_liquidation_id' => null]);
    }

    /**
     * Agrega nuevos detalles a una liquidación borrador.
     *
     * @param array<int, int> $serviceRequestIdsToAdd
     */
    private function addCommissionDetails(CommissionLiquidation $commission, string $periodStart, string $periodEnd, array $serviceRequestIdsToAdd): void
    {
        $commissionData = $this->commissionService->getProfessionalCommissionData(
            $commission->professional_id,
            $periodStart,
            $periodEnd,
            $commission->id
        );

        $availableServices = collect($commissionData['services'])->keyBy('service_request_id');

        foreach ($serviceRequestIdsToAdd as $serviceRequestId) {
            $service = $availableServices->get($serviceRequestId);

            if (!$service) {
                throw new \Exception("El servicio {$serviceRequestId} no está disponible para el rango seleccionado.");
            }

            \App\Models\CommissionLiquidationDetail::create([
                'liquidation_id' => $commission->id,
                'service_request_id' => $service['service_request_id'],
                'patient_id' => $service['patient_id'],
                'service_id' => $service['service_id'] ?? null,
                'service_date' => $service['service_date'],
                'payment_date' => $service['payment_date'],
                'service_amount' => $service['service_amount'],
                'commission_percentage' => $service['commission_percentage'],
                'commission_amount' => $service['commission_amount'],
                'payment_movement_id' => $service['movement_id'],
            ]);

            \App\Models\Transaction::where('id', $service['movement_id'])
                ->update(['commission_liquidation_id' => $commission->id]);
        }
    }

    /**
     * Recalcula los totales de una liquidación borrador a partir de sus detalles actuales.
     */
    private function refreshCommissionLiquidationTotals(CommissionLiquidation $commission, string $periodStart, string $periodEnd): void
    {
        $remainingDetails = $commission->fresh('details')->details;

        $commission->update([
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'total_services' => $remainingDetails->count(),
            'gross_amount' => $remainingDetails->sum('service_amount'),
            'commission_percentage' => $remainingDetails->count() > 0
                ? $remainingDetails->first()->commission_percentage
                : 0,
            'commission_amount' => $remainingDetails->sum('commission_amount'),
        ]);
    }

    /**
     * Approve the specified commission liquidation.
     */
    public function approve(CommissionLiquidation $commission): RedirectResponse
    {
        try {
            $this->commissionService->approveLiquidation($commission, auth()->id());

            return redirect()->route('medical.commissions.show', $commission)
                ->with('success', 'Liquidación aprobada exitosamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => [$e->getMessage()]]);
        }
    }

    /**
     * Process payment for the specified commission liquidation.
     */
    public function pay(Request $request, CommissionLiquidation $commission): RedirectResponse
    {
        try {
            // Get active cash register session
            $cashRegisterService = app(\App\Services\CashRegisterService::class);
            $activeSession = $cashRegisterService->getActiveSession(auth()->user());

            if (!$activeSession) {
                return back()->withErrors(['general' => ['No hay una caja abierta. Debe abrir caja primero.']]);
            }

            $result = $this->commissionService->processPayment(
                $commission,
                $activeSession->id,
                auth()->id()
            );

            return back()->with('success', 'Pago de liquidación procesado exitosamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => [$e->getMessage()]]);
        }
    }

    /**
     * Cancel the specified commission liquidation.
     */
    public function cancel(CommissionLiquidation $commission): RedirectResponse
    {
        try {
            $this->commissionService->cancelLiquidation($commission);

            return redirect()->route('medical.commissions.index')
                ->with('success', 'Liquidación cancelada exitosamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => [$e->getMessage()]]);
        }
    }

    /**
     * Revert payment for the specified commission liquidation.
     * Only cashier manager can perform this action.
     */
    public function revertPayment(Request $request, CommissionLiquidation $commission): RedirectResponse
    {
        // Validar que el usuario tenga permiso de gestión de caja
        if (!auth()->user()->can('manage_cash_register')) {
            return back()->withErrors(['general' => ['No tiene permisos para revertir pagos de liquidaciones.']]);
        }

        $request->validate([
            'reason' => 'required|string|min:10|max:500',
        ]);

        try {
            $this->commissionService->revertPayment(
                $commission,
                auth()->id(),
                $request->reason
            );

            return redirect()->route('medical.commissions.index')
                ->with('success', 'Pago revertido exitosamente. La liquidación volvió a estado aprobado.');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => [$e->getMessage()]]);
        }
    }

    /**
     * Remove the specified commission liquidation.
     */
    public function destroy(CommissionLiquidation $commission): RedirectResponse
    {
        if (!$commission->isDraft()) {
            return back()->withErrors(['general' => ['Solo se pueden eliminar liquidaciones en estado borrador.']]);
        }

        try {
            $commission->delete();

            return redirect()->route('medical.commissions.index')
                ->with('success', 'Liquidación eliminada exitosamente.');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => [$e->getMessage()]]);
        }
    }

    /**
     * Get commission report for a professional.
     */
    public function report(Request $request): RedirectResponse
    {
        return redirect()->route('medical.commissions.index', [
            'tab' => 'reports',
        ]);
    }

    /**
     * Get pending liquidations for approval.
     */
    public function pending(): RedirectResponse
    {
        return redirect()->route('medical.commissions.index', [
            'tab' => 'approvals',
        ]);
    }

    /**
     * API endpoint to get commission data for a professional and period.
     */
    public function getCommissionData(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $validated = $request->validate([
                'professional_id' => 'required|integer|exists:professionals,id',
                'start_date' => 'required|date_format:Y-m-d',
                'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
                'liquidation_id' => 'nullable|integer|exists:commission_liquidations,id',
            ]);

            $data = $this->commissionService->getProfessionalCommissionData(
                $validated['professional_id'],
                $validated['start_date'],
                $validated['end_date'],
                $validated['liquidation_id'] ?? null
            );

            return response()->json($data);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'errors' => $e->errors()], 400);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get transactions for a specific commission liquidation
     */
    public function getTransactions(CommissionLiquidation $commission): \Illuminate\Http\JsonResponse
    {
        try {
            $transactions = $commission->transactions()
                ->with(['user', 'service'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'transactions' => $transactions,
                'count' => $transactions->count(),
                'total' => $transactions->sum('amount')
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get details (items/services) for a specific commission liquidation
     */
    public function getDetails(CommissionLiquidation $commission): \Illuminate\Http\JsonResponse
    {
        try {
            $details = $commission->details()
                ->with([
                    'serviceRequest.patient',
                    'serviceRequest.details.insuranceType',
                    'serviceRequest.details.professional',
                    'service',
                ])
                ->orderBy('created_at', 'desc')
                ->get();

            // Get professional specialty name
            $professional = $commission->load('professional.specialties', 'generatedBy')->professional;
            $specialtyName = $professional?->specialties?->first()?->name ?? 'N/A';

            $mappedDetails = $details->map(function ($detail) {
                $requestDetail = $detail->serviceRequest?->details
                    ?->first(function ($item) use ($detail) {
                        return (int) $item->medical_service_id === (int) $detail->service_id;
                    }) ?? $detail->serviceRequest?->details?->first();

                return [
                    'id' => $detail->id,
                    'service_request_id' => $detail->service_request_id,
                    'patient_id' => $detail->serviceRequest?->patient_id,
                    'patient_name' => $detail->serviceRequest?->patient?->full_name ?? 'N/A',
                    'service_id' => $detail->service_id,
                    'service_name' => $detail->service?->name ?? 'Servicio desconocido',
                    'professional_name' => $requestDetail?->professional?->full_name ?? 'Profesional no especificado',
                    'insurance_type_name' => $requestDetail?->insuranceType?->name ?? 'Sin seguro',
                    'service_request_date' => $detail->serviceRequest?->request_date
                        ? \Carbon\Carbon::parse($detail->serviceRequest->request_date)->format('Y-m-d')
                        : null,
                    'service_amount' => $detail->service_amount,
                    'commission_percentage' => $detail->commission_percentage,
                    'commission_amount' => $detail->commission_amount,
                    'service_date' => $detail->service_date 
                        ? \Carbon\Carbon::parse($detail->service_date)->format('Y-m-d')
                        : null,
                ];
            });

            $totalServices = $mappedDetails->sum('service_amount');
            $totalCommission = $mappedDetails->sum('commission_amount');

            return response()->json([
                'liquidation' => [
                    'id' => $commission->id,
                    'professional_id' => $commission->professional_id,
                    'professional_name' => $professional?->full_name ?? 'N/A',
                    'professional_specialty' => $specialtyName,
                    'period_start' => $commission->period_start,
                    'period_end' => $commission->period_end,
                    'status' => $commission->status,
                    'total_services' => $commission->total_services,
                    'gross_amount' => $commission->gross_amount,
                    'commission_percentage' => $commission->commission_percentage,
                    'commission_amount' => $commission->commission_amount,
                    'generated_at' => $commission->created_at,
                    'generated_by_name' => $commission->generatedBy?->name,
                    'approved_at' => $commission->updated_at,
                ],
                'services' => $mappedDetails->map(function($detail) {
                    return [
                        'id' => $detail['id'],
                        'service_request_id' => $detail['service_request_id'],
                        'patient_id' => $detail['patient_id'],
                        'patient_name' => $detail['patient_name'],
                        'service_id' => $detail['service_id'],
                        'service_name' => $detail['service_name'],
                        'professional_name' => $detail['professional_name'],
                        'insurance_type_name' => $detail['insurance_type_name'],
                        'service_request_date' => $detail['service_request_date'],
                        'service_amount' => $detail['service_amount'],
                        'commission_percentage' => $detail['commission_percentage'],
                        'commission_amount' => $detail['commission_amount'],
                        'service_date' => $detail['service_date'],
                    ];
                }),
                'details' => $mappedDetails,
                'count' => $mappedDetails->count(),
                'total_services' => $totalServices,
                'total_commission' => $totalCommission,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get dashboard summary statistics
     * 
     * @return array<string, int|float>
     */
    private function getDashboardSummary(): array
    {
        // Excluir liquidaciones canceladas
        $allLiquidations = CommissionLiquidation::where('status', '!=', CommissionLiquidation::STATUS_CANCELLED)->get();
        $totalCommissions = $allLiquidations->sum('commission_amount');
        $activeProfessionals = CommissionLiquidation::distinct()->count('professional_id');
        $totalLiquidations = CommissionLiquidation::where('status', '!=', CommissionLiquidation::STATUS_CANCELLED)->count();
        $pendingLiquidations = CommissionLiquidation::whereIn('status', [
            CommissionLiquidation::STATUS_DRAFT, 
            CommissionLiquidation::STATUS_APPROVED
        ])->count();

        return [
            'total_commissions' => $totalCommissions,
            'active_professionals' => $activeProfessionals,
            'total_liquidations' => $totalLiquidations,
            'pending_liquidations' => $pendingLiquidations,
            'growth_rate' => $this->calculateGrowthRate(),
        ];
    }

    /**
     * Calculate growth rate for current month
     * 
     * @return float
     */
    private function calculateGrowthRate(): float
    {
        $currentMonthTotal = CommissionLiquidation::where('status', CommissionLiquidation::STATUS_PAID)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('commission_amount');
        
        $lastMonthTotal = CommissionLiquidation::where('status', CommissionLiquidation::STATUS_PAID)
            ->whereMonth('created_at', now()->subMonth()->month)
            ->whereYear('created_at', now()->subMonth()->year)
            ->sum('commission_amount');

        return $lastMonthTotal > 0 
            ? (($currentMonthTotal - $lastMonthTotal) / $lastMonthTotal) * 100 
            : 0;
    }

    /**
     * Get monthly trend data for dashboard
     * 
     * @return \Illuminate\Support\Collection
     */
    private function getMonthlyTrend()
    {
        return CommissionLiquidation::where('status', CommissionLiquidation::STATUS_PAID)
            ->get()
            ->groupBy(fn($item) => $item->created_at->format('Y-m'))
            ->map(fn($group) => [
                'month' => $group->first()->created_at->format('Y-m'),
                'amount' => $group->sum('commission_amount'),
                'liquidations' => $group->count(),
            ])
            ->sortBy('month')
            ->values()
            ->take(3);
    }

    /**
     * Get pending approvals for dashboard
     * 
     * @return \Illuminate\Support\Collection
     */
    private function getPendingApprovals()
    {
        return CommissionLiquidation::with(['professional'])
            ->where('status', CommissionLiquidation::STATUS_DRAFT)
            ->orderBy('created_at', 'asc')
            ->limit(5)
            ->get()
            ->map(fn($liq) => [
                'id' => $liq->id,
                'professional_name' => $liq->professional->full_name ?? 'Desconocido',
                'period_start' => $liq->period_start,
                'period_end' => $liq->period_end,
                'commission_amount' => $liq->commission_amount,
                'days_pending' => $liq->created_at->diffInDays(now()),
            ]);
    }

    /**
     * Get top professionals by commission
     * 
     * @return \Illuminate\Support\Collection
     */
    private function getTopProfessionals()
    {
        return CommissionLiquidation::with(['professional'])
            ->where('status', CommissionLiquidation::STATUS_PAID)
            ->get()
            ->groupBy('professional_id')
            ->map(function($group) {
                $first = $group->first();
                $professional = $first->professional;
                $specialty = $professional->specialties->where('pivot.is_primary', true)->first();
                
                return [
                    'id' => $professional->id,
                    'name' => $professional->full_name ?? 'Desconocido',
                    'specialty' => $specialty?->name ?? 'N/A',
                    'total_commissions' => $group->sum('commission_amount'),
                    'liquidations_count' => $group->count(),
                ];
            })
            ->sortByDesc('total_commissions')
            ->values()
            ->take(5);
    }

    /**
     * Get recent liquidations for dashboard
     * 
     * @return \Illuminate\Support\Collection
     */
    private function getRecentLiquidations()
    {
        return CommissionLiquidation::with(['professional'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function($liq) {
                $specialty = $liq->professional->specialties->where('pivot.is_primary', true)->first();
                return [
                    'id' => $liq->id,
                    'professional_name' => $liq->professional->full_name ?? 'Desconocido',
                    'specialty_name' => $specialty?->name ?? 'N/A',
                    'period_start' => $liq->period_start,
                    'period_end' => $liq->period_end,
                    'commission_amount' => $liq->commission_amount,
                    'status' => $liq->status,
                    'created_at' => $liq->created_at->toDateString(),
                ];
            });
    }

    /**
     * Get dashboard data with real statistics
     */
    public function getDashboardData(): \Illuminate\Http\JsonResponse
    {
        try {
            return response()->json([
                'summary' => $this->getDashboardSummary(),
                'monthly_trend' => $this->getMonthlyTrend(),
                'pending_approvals' => $this->getPendingApprovals(),
                'top_professionals' => $this->getTopProfessionals(),
                'recent_liquidations' => $this->getRecentLiquidations(),
            ]);
        } catch (\Exception $e) {
            \Log::error('DashboardData Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get commission report with real data
     */
    public function reportData(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $professionalId = $request->input('professional_id');

            $query = CommissionLiquidation::with(['professional.specialties'])
                ->where('status', CommissionLiquidation::STATUS_PAID);

            // Apply date filters - search within the period range
            if ($startDate) {
                $query->where('period_end', '>=', $startDate);
            }

            if ($endDate) {
                $query->where('period_start', '<=', $endDate);
            }

            if ($professionalId) {
                $query->where('professional_id', $professionalId);
            }

            $liquidations = $query->orderBy('created_at', 'desc')->get();

            // Group by professional
            $professionals = $liquidations->groupBy('professional_id')->map(function ($group) {
                $first = $group->first();
                $professional = $first->professional;
                
                // Calculate commission properly
                $totalGrossAmount = $group->sum('gross_amount');
                $commissionPercentage = $first->commission_percentage ?? 0;
                $commissionAmount = $totalGrossAmount * ($commissionPercentage / 100);

                return [
                    'professional_id' => $first->professional_id,
                    'professional_name' => $professional ? "{$professional->first_name} {$professional->last_name}" : 'Desconocido',
                    'specialty_name' => $professional && $professional->specialties?->first() 
                        ? $professional->specialties->first()->name 
                        : 'N/A',
                    'total_services' => $group->sum('total_services'),
                    'total_service_amount' => $totalGrossAmount,
                    'commission_percentage' => $commissionPercentage,
                    'commission_amount' => $commissionAmount,
                    'liquidation_status' => CommissionLiquidation::STATUS_PAID,
                ];
            })->values();

            // Calculate totals
            $totalCommission = $professionals->sum('commission_amount');
            $paidCommission = $totalCommission; // All are paid since we filtered by STATUS_PAID
            $pendingCommission = 0;

            $summary = [
                'total_liquidations' => $liquidations->count(),
                'total_commission' => $totalCommission,
                'paid_commission' => $paidCommission,
                'pending_commission' => $pendingCommission,
            ];

            $reportSummary = [
                'total_professionals' => $professionals->count(),
                'total_services' => $liquidations->sum('total_services'),
                'total_amount' => $liquidations->sum('gross_amount'),
                'total_commissions' => $totalCommission,
            ];

            return response()->json([
                'report' => [
                    'professionals' => $professionals,
                    'period' => [
                        'start' => $startDate,
                        'end' => $endDate,
                    ],
                    'summary' => $summary,
                    'liquidations' => $liquidations,
                ],
                'summary' => $reportSummary,
            ]);
        } catch (\Exception $e) {
            \Log::error('ReportData Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get professional commissions for settings
     */
    public function getProfessionalCommissions()
    {
        try {
            $commissions = \DB::table('professional_commission_settings')
                ->select('id', 'professional_id', 'commission_percentage', 'created_at', 'updated_at')
                ->get();

            return response()->json($commissions);
        } catch (\Exception $e) {
            \Log::error('ProfessionalCommissions Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Update professional commission percentage
     */
    public function updateProfessionalCommission(Request $request, $professionalId)
    {
        try {
            $validated = $request->validate([
                'commission_percentage' => 'required|numeric|min:0|max:100',
            ]);

            // Update in professional_commission_settings as single source of truth
            $professional = \App\Models\Professional::findOrFail($professionalId);
            
            // Update or create commission settings
            $professional->commissionSettings()->updateOrCreate(
                ['professional_id' => $professionalId],
                ['commission_percentage' => $validated['commission_percentage']]
            );

            return response()->json([
                'message' => 'Comisión actualizada correctamente',
                'professional_id' => $professionalId,
                'commission_percentage' => $validated['commission_percentage'],
            ]);
        } catch (\Exception $e) {
            \Log::error('UpdateProfessionalCommission Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * API: Get all professional commissions (JSON response)
     */
    public function apiGetProfessionalCommissions()
    {
        try {
            $commissions = \DB::table('professional_commission_settings')
                ->select('id', 'professional_id', 'commission_percentage', 'created_at', 'updated_at')
                ->get();

            return response()->json($commissions->toArray());
        } catch (\Exception $e) {
            \Log::error('API ProfessionalCommissions Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * API: Update professional commission percentage
     */
    public function apiUpdateProfessionalCommission(Request $request, $professionalId)
    {
        try {
            $validated = $request->validate([
                'commission_percentage' => 'required|numeric|min:0|max:100',
            ]);

            // Update directly in professionals table
            $professional = \App\Models\Professional::findOrFail($professionalId);
            $professional->commission_percentage = $validated['commission_percentage'];
            $professional->save();

            return response()->json([
                'message' => 'Comisión actualizada correctamente',
                'professional_id' => $professionalId,
                'commission_percentage' => $validated['commission_percentage'],
            ]);
        } catch (\Exception $e) {
            \Log::error('API UpdateProfessionalCommission Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}