<?php

namespace App\Http\Controllers;

use App\Events\PendingServicePaymentCancelled;
use App\Events\PendingServicePaymentRequested;
use App\Models\ServiceRequest;
use App\Models\Patient;
use App\Models\MedicalService;
use App\Models\Professional;
use App\Models\InsuranceType;
use App\Models\ScheduleAppointment;
use App\Models\ServiceRequestDetail;
use App\Models\ServiceCategory;
use App\Models\Laboratory\LabSample;
use App\Models\Laboratory\LabSampleType;
use App\Models\Transaction;
use App\Models\AuditLog;
use App\Notifications\CashPendingServiceNotification;
use App\Services\NotificationRecipientResolver;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ServiceRequestController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = ServiceRequest::query()->with([
            'patient',
            'createdBy',
            'details.medicalService',
            'details.professional'
        ]);

        // Filtros
        if ($request->status) {
            $query->byStatus($request->status);
        }

        if ($request->payment_status) {
            $query->byPaymentStatus($request->payment_status);
        }

        if ($request->reception_type) {
            $query->where('reception_type', $request->reception_type);
        }

        if ($request->date_from) {
            $query->where('request_date', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->where('request_date', '<=', $request->date_to);
        }

        if ($request->search) {
            $query->whereHas('patient', function ($q) use ($request) {
                $q->where('first_name', 'like', '%' . $request->search . '%')
                  ->orWhere('last_name', 'like', '%' . $request->search . '%')
                  ->orWhere('document_number', 'like', '%' . $request->search . '%');
            })
            ->orWhere('request_number', 'like', '%' . $request->search . '%');
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
                'request_date' => $request->request_date->format('Y-m-d'),
                'request_time' => $request->request_time,
                'status' => $request->status,
                'reception_type' => $request->reception_type,
                'priority' => $request->priority,
                'total_amount' => $request->total_amount,
                'paid_amount' => $request->paid_amount,
                'payment_status' => $request->payment_status,
                'remaining_amount' => $request->remaining_amount,
                'services_count' => $request->details->count(),
                'created_by' => $request->createdBy->name,
                'created_at' => $request->created_at->format('Y-m-d H:i'),
            ];
        });

        return Inertia::render('medical/service-requests/Index', [
            'serviceRequests' => $serviceRequests,
            'filters' => $request->only([
                'status', 'payment_status', 'reception_type', 
                'date_from', 'date_to', 'search'
            ]),
            'statusOptions' => [
                ['value' => ServiceRequest::STATUS_PENDING_CONFIRMATION, 'label' => 'Pendiente Confirmación'],
                ['value' => ServiceRequest::STATUS_CONFIRMED, 'label' => 'Confirmado'],
                ['value' => ServiceRequest::STATUS_IN_PROGRESS, 'label' => 'En Proceso'],
                ['value' => ServiceRequest::STATUS_PENDING_PAYMENT, 'label' => 'Pendiente Pago'],
                ['value' => ServiceRequest::STATUS_PAID, 'label' => 'Pagado'],
                ['value' => ServiceRequest::STATUS_CANCELLED, 'label' => 'Cancelado'],
            ],
            'paymentStatusOptions' => [
                ['value' => ServiceRequest::PAYMENT_PENDING, 'label' => 'Pendiente'],
                ['value' => ServiceRequest::PAYMENT_PARTIAL, 'label' => 'Parcial'],
                ['value' => ServiceRequest::PAYMENT_PAID, 'label' => 'Pagado'],
            ],
            'receptionTypeOptions' => [
                ['value' => ServiceRequest::RECEPTION_SCHEDULED, 'label' => 'Programada'],
                ['value' => ServiceRequest::RECEPTION_WALK_IN, 'label' => 'Walk-in'],
                ['value' => ServiceRequest::RECEPTION_EMERGENCY, 'label' => 'Emergencia'],
                ['value' => ServiceRequest::RECEPTION_INPATIENT_DISCHARGE, 'label' => 'Alta Hospitalaria'],
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('medical/service-requests/Create', [
            'patients' => Patient::where('status', 'active')
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'document_type', 'document_number']),
            'medicalServices' => MedicalService::with('category')
                ->where('status', 'active')
                ->orderBy('name')
                ->get(),
            'professionals' => Professional::where('status', 'active')
                ->with('commissionSettings')
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(),
            'insuranceTypes' => InsuranceType::where('status', 'active')
                ->orderBy('name')
                ->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'patient_id' => ['required', 'exists:patients,id'],
            'appointment_id' => ['nullable', 'exists:schedule_appointments,id'],
            'reception_type' => ['required', Rule::in([
                ServiceRequest::RECEPTION_SCHEDULED,
                ServiceRequest::RECEPTION_WALK_IN,
                ServiceRequest::RECEPTION_EMERGENCY,
                ServiceRequest::RECEPTION_INPATIENT_DISCHARGE,
            ])],
            'priority' => ['required', Rule::in([
                ServiceRequest::PRIORITY_LOW,
                ServiceRequest::PRIORITY_NORMAL,
                ServiceRequest::PRIORITY_HIGH,
                ServiceRequest::PRIORITY_URGENT,
            ])],
            'request_date' => ['required', 'date'],
            'request_time' => ['nullable', 'date_format:H:i'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'services' => ['required', 'array', 'min:1'],
            'services.*.medical_service_id' => ['required', 'exists:medical_services,id'],
            'services.*.professional_id' => ['nullable', 'exists:professionals,id'],
            'services.*.insurance_type_id' => ['required', 'exists:insurance_types,id'],
            'services.*.scheduled_date' => ['nullable', 'date'],
            'services.*.scheduled_time' => ['nullable', 'date_format:H:i'],
            'services.*.estimated_duration' => ['nullable', 'integer', 'min:15', 'max:480'],
            'services.*.unit_price' => ['required', 'numeric', 'min:0'],
            'services.*.quantity' => ['required', 'integer', 'min:1', 'max:10'],
            'services.*.discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'services.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
            'services.*.preparation_instructions' => ['nullable', 'string', 'max:500'],
            'services.*.notes' => ['nullable', 'string', 'max:500'],
        ]);

        $appointment = null;

        if (!empty($validated['appointment_id'])) {
            $appointment = ScheduleAppointment::find($validated['appointment_id']);

            if (!$appointment) {
                throw ValidationException::withMessages([
                    'appointment_id' => 'La cita seleccionada no existe.',
                ]);
            }

            if ($appointment->service_request_id) {
                throw ValidationException::withMessages([
                    'appointment_id' => 'La cita seleccionada ya fue enviada a recepción.',
                ]);
            }
        }

        $shouldAutoConfirmFromAppointment = $appointment !== null;

        $serviceRequest = DB::transaction(function () use ($appointment, $shouldAutoConfirmFromAppointment, $validated) {
            $requestedServiceIds = collect($validated['services'])
                ->pluck('medical_service_id')
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values()
                ->all();

            $laboratoryServiceIds = $this->resolveLaboratoryServiceIds($requestedServiceIds);
            $medicalServiceNames = MedicalService::query()
                ->whereIn('id', $requestedServiceIds)
                ->pluck('name', 'id')
                ->mapWithKeys(fn ($name, $id) => [(int) $id => (string) $name])
                ->all();

            $sampleTypeIdsByCode = LabSampleType::query()
                ->where('status', 'active')
                ->pluck('id', 'code')
                ->mapWithKeys(fn ($id, $code) => [(string) $code => (int) $id])
                ->all();

            $serviceRequest = ServiceRequest::create([
                'patient_id' => $validated['patient_id'],
                'created_by' => auth()->id(),
                'request_date' => $validated['request_date'],
                'request_time' => $validated['request_time'] ?? null,
                'reception_type' => $validated['reception_type'],
                'priority' => $validated['priority'],
                'notes' => $validated['notes'] ?? null,
                'status' => $shouldAutoConfirmFromAppointment
                    ? ServiceRequest::STATUS_CONFIRMED
                    : ServiceRequest::STATUS_PENDING_CONFIRMATION,
                'payment_status' => ServiceRequest::PAYMENT_PENDING,
                'total_amount' => 0,
                'paid_amount' => 0,
                'confirmed_at' => $shouldAutoConfirmFromAppointment ? now() : null,
            ]);

            foreach ($validated['services'] as $index => $serviceData) {
                $medicalServiceId = (int) $serviceData['medical_service_id'];
                $isLaboratoryService = in_array($medicalServiceId, $laboratoryServiceIds, true);
                $professionalId = isset($serviceData['professional_id']) && (int) $serviceData['professional_id'] > 0
                    ? (int) $serviceData['professional_id']
                    : null;

                if (! $isLaboratoryService && ! $professionalId) {
                    throw ValidationException::withMessages([
                        "services.{$index}.professional_id" => 'Debe seleccionar un profesional para los servicios no laboratoriales.',
                    ]);
                }

                $professional = $professionalId
                    ? Professional::with('commissionSettings')->find($professionalId)
                    : null;
                $commissionPercentage = $professional?->commissionSettings?->commission_percentage ?? 0;

                \Log::info('Service detail created with commission percentage', [
                    'professional_id' => $professionalId,
                    'professional_name' => $professional?->full_name,
                    'commission_percentage' => $commissionPercentage,
                    'source' => 'professional_commission_settings',
                ]);

                $detail = $serviceRequest->details()->create([
                    'medical_service_id' => $medicalServiceId,
                    'professional_id' => $professionalId,
                    'professional_commission_percentage' => $commissionPercentage,
                    'insurance_type_id' => $serviceData['insurance_type_id'],
                    'scheduled_date' => $serviceData['scheduled_date'] ?? null,
                    'scheduled_time' => $serviceData['scheduled_time'] ?? null,
                    'estimated_duration' => $serviceData['estimated_duration'] ?? 30,
                    'unit_price' => $serviceData['unit_price'],
                    'quantity' => $serviceData['quantity'],
                    'discount_percentage' => $serviceData['discount_percentage'] ?? 0,
                    'discount_amount' => $serviceData['discount_amount'] ?? 0,
                    'preparation_instructions' => $serviceData['preparation_instructions'] ?? null,
                    'notes' => $serviceData['notes'] ?? null,
                    'status' => ServiceRequestDetail::STATUS_PENDING,
                ]);

                if ($isLaboratoryService) {
                    $serviceName = $medicalServiceNames[$medicalServiceId] ?? null;

                    LabSample::create([
                        'service_request_detail_id' => $detail->id,
                        'patient_id' => $serviceRequest->patient_id,
                        'sample_number' => $this->generateLabSampleNumber(),
                        'barcode' => null,
                        'lab_sample_type_id' => $this->inferSampleTypeIdFromServiceName($serviceName, $sampleTypeIdsByCode),
                        'collected_at' => null,
                        'received_at' => null,
                        'received_by' => null,
                        'status' => 'pending_collection',
                        'remarks' => 'Generado automáticamente desde recepción.',
                    ]);
                }
            }

            if ($appointment) {
                $appointment->update([
                    'service_request_id' => $serviceRequest->id,
                    'status' => ScheduleAppointment::STATUS_CHECKED_IN,
                    'checked_in_at' => now(),
                ]);
            }

            return $serviceRequest->refresh()->load(['patient', 'details']);
        });

        if ($serviceRequest->payment_status === ServiceRequest::PAYMENT_PENDING) {
            PendingServicePaymentRequested::dispatch($serviceRequest);

            app(NotificationRecipientResolver::class)
                ->cashPendingServiceRecipients()
                ->each
                ->notify(new CashPendingServiceNotification(
                    $serviceRequest->fresh(['patient']),
                    'Nueva solicitud pendiente de pago en caja.',
                    'pending-service-created',
                ));
        }

        return redirect()
            ->route('medical.service-requests.show', $serviceRequest)
            ->with('message', 'Solicitud de servicio creada exitosamente.');
    }

    private function resolveLaboratoryServiceIds(array $requestedServiceIds): array
    {
        if (empty($requestedServiceIds)) {
            return [];
        }

        $labRootId = ServiceCategory::query()
            ->where('name', 'Laboratorio Clínico')
            ->whereNull('parent_id')
            ->value('id');

        return MedicalService::query()
            ->whereIn('id', $requestedServiceIds)
            ->whereHas('category', function ($query) use ($labRootId) {
                $query->where(function ($subQuery) use ($labRootId) {
                    if ($labRootId) {
                        $subQuery->where('parent_id', $labRootId);
                    }

                    $subQuery->orWhereIn('name', [
                        'servicios de Analisis',
                        'Análisis Microbiología',
                    ]);
                });
            })
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();
    }

    private function generateLabSampleNumber(): string
    {
        do {
            $sampleNumber = 'LAB-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(4));
        } while (LabSample::query()->where('sample_number', $sampleNumber)->exists());

        return $sampleNumber;
    }

    private function inferSampleTypeIdFromServiceName(?string $serviceName, array $sampleTypeIdsByCode): ?int
    {
        if (!$serviceName) {
            return null;
        }

        $name = Str::lower($serviceName);

        if (str_contains($name, 'orina')) {
            return $sampleTypeIdsByCode['URINE'] ?? $sampleTypeIdsByCode['URINE24H'] ?? null;
        }

        if (str_contains($name, 'heces') || str_contains($name, 'copro')) {
            return $sampleTypeIdsByCode['STOOL'] ?? null;
        }

        if (str_contains($name, 'esputo')) {
            return $sampleTypeIdsByCode['SPUTUM'] ?? null;
        }

        if (str_contains($name, 'hisopado') && str_contains($name, 'nas')) {
            return $sampleTypeIdsByCode['NASAL_SWAB'] ?? null;
        }

        if (str_contains($name, 'hisopado') || str_contains($name, 'farin')) {
            return $sampleTypeIdsByCode['THROAT_SWAB'] ?? null;
        }

        if (str_contains($name, 'lcr') || str_contains($name, 'cefalorra')) {
            return $sampleTypeIdsByCode['CSF'] ?? null;
        }

        if (str_contains($name, 'sinov')) {
            return $sampleTypeIdsByCode['SYNOVIAL'] ?? null;
        }

        if (str_contains($name, 'biops')) {
            return $sampleTypeIdsByCode['BIOPSY'] ?? null;
        }

        if (str_contains($name, 'coagul') || str_contains($name, 'plasma')) {
            return $sampleTypeIdsByCode['PLASMA'] ?? null;
        }

        if (str_contains($name, 'suero')) {
            return $sampleTypeIdsByCode['SERUM'] ?? null;
        }

        return $sampleTypeIdsByCode['BLOOD'] ?? null;
    }

    /**
     * Display the specified resource.
     */
    public function show(ServiceRequest $serviceRequest)
    {
        $serviceRequest->load([
            'patient.insurances',
            'createdBy',
            'cancelledBy',
            'details.medicalService.category',
            'details.professional',
            'details.insuranceType',
            'transactions' => function($query) {
                $query->orderBy('created_at', 'desc');
            }
        ]);

        $serviceRequestData = [
            'id' => $serviceRequest->id,
            'request_number' => $serviceRequest->request_number,
            'request_date' => $serviceRequest->request_date->format('Y-m-d'),
            'request_time' => $serviceRequest->request_time,
            'status' => $serviceRequest->status,
            'reception_type' => $serviceRequest->reception_type,
            'priority' => $serviceRequest->priority,
            'total_amount' => $serviceRequest->total_amount,
            'paid_amount' => $serviceRequest->paid_amount,
            'payment_status' => $serviceRequest->payment_status,
            'remaining_amount' => $serviceRequest->remaining_amount,
            'created_at' => $serviceRequest->created_at->format('Y-m-d H:i:s'),
            'patient' => [
                'id' => $serviceRequest->patient->id,
                'name' => $serviceRequest->patient->first_name,
                'last_name' => $serviceRequest->patient->last_name,
                'document_type' => $serviceRequest->patient->document_type,
                'document_number' => $serviceRequest->patient->document_number,
                'phone' => $serviceRequest->patient->phone,
                'email' => $serviceRequest->patient->email,
                'date_of_birth' => $serviceRequest->patient->date_of_birth?->format('Y-m-d'),
            ],
            'service_details' => $serviceRequest->details->map(function ($detail) {
                return [
                    'id' => $detail->id,
                    'medical_service_name' => $detail->medicalService->name,
                    'professional_id' => $detail->professional_id,
                    'professional_name' => $detail->professional ? $detail->professional->full_name : 'No asignado',
                    'insurance_type_name' => $detail->insuranceType->name,
                    'scheduled_date' => $detail->scheduled_date?->format('Y-m-d'),
                    'scheduled_time' => $detail->scheduled_time,
                    'estimated_duration' => $detail->estimated_duration ?? 30,
                    'unit_price' => $detail->unit_price,
                    'quantity' => $detail->quantity,
                    'discount_percentage' => $detail->discount_percentage ?? 0,
                    'discount_amount' => $detail->discount_amount ?? 0,
                    'subtotal' => $detail->subtotal,
                    'total' => $detail->total_amount,
                    'preparation_instructions' => $detail->preparation_instructions,
                    'notes' => $detail->notes,
                    'status' => $detail->status,
                ];
            })->toArray(),
            'notes' => $serviceRequest->notes,
            'created_by_name' => $serviceRequest->createdBy->name,
            'updated_by_name' => null,
            'updated_at' => $serviceRequest->updated_at?->format('Y-m-d H:i:s'),
            'transactions' => $serviceRequest->transactions->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'amount' => $transaction->amount,
                    'type' => $transaction->type,
                    'method' => $transaction->payment_method,
                    'status' => $transaction->status,
                    'date' => $transaction->created_at->format('d/m/Y'),
                    'time' => $transaction->created_at->format('H:i:s'),
                    'reference' => $transaction->reference_number,
                    'notes' => $transaction->notes,
                ];
            })->toArray(),
        ];

        // If JSON request (for modal), return JSON
        if (request()->expectsJson()) {
            return response()->json([
                'props' => [
                    'serviceRequest' => $serviceRequestData
                ]
            ]);
        }

        return Inertia::render('medical/service-requests/Show', [
            'serviceRequest' => $serviceRequestData,
            'professionals' => Professional::query()
                ->where('status', 'active')
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name'])
                ->map(fn (Professional $professional) => [
                    'id' => $professional->id,
                    'name' => $professional->full_name,
                ])
                ->toArray(),
        ]);
    }

    /**
     * Transfer service detail to another medical professional.
     */
    public function transferProfessional(Request $request, ServiceRequest $serviceRequest, ServiceRequestDetail $detail): RedirectResponse
    {
        if ($detail->service_request_id !== $serviceRequest->id) {
            abort(404, 'El detalle de servicio no pertenece a la solicitud indicada.');
        }

        if ($serviceRequest->isCancelled() || $detail->isCancelled()) {
            throw ValidationException::withMessages([
                'service' => 'No se puede transferir un servicio cancelado.',
            ]);
        }

        $validated = $request->validate([
            'professional_id' => ['required', 'exists:professionals,id', Rule::exists('professionals', 'id')->where('status', 'active')],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $newProfessionalId = (int) $validated['professional_id'];
        $oldProfessionalId = (int) $detail->professional_id;
        $transferReason = $validated['reason'] ?? null;

        if ($newProfessionalId === $oldProfessionalId) {
            throw ValidationException::withMessages([
                'professional_id' => 'Debe seleccionar un profesional diferente al actual.',
            ]);
        }

        // Si el servicio ya está pagado, solo perfiles administrativos pueden reasignar.
        $isAdministrativeUser = (bool) auth()->user()?->canAny([
            'admin.cash_register',
            'access-commissions',
            'access-user-management',
        ]);

        if ($serviceRequest->payment_status === ServiceRequest::PAYMENT_PAID && !$isAdministrativeUser) {
            abort(403, 'Este servicio ya fue pagado. La transferencia requiere un perfil administrativo.');
        }

        // Regla principal: no permitir transferencia si la comisión del servicio ya fue liquidada.
        $hasLiquidatedCommission = false;

        if ($detail->movement_detail_id) {
            $hasLiquidatedCommission = Transaction::query()
                ->where('id', $detail->movement_detail_id)
                ->where('status', 'active')
                ->whereNotNull('commission_liquidation_id')
                ->exists();
        }

        if (!$hasLiquidatedCommission) {
            $fallbackLiquidatedQuery = Transaction::query()
                ->where('service_request_id', $serviceRequest->id)
                ->where('professional_id', $oldProfessionalId)
                ->where('type', 'INCOME')
                ->where('category', 'SERVICE_PAYMENT')
                ->where('status', 'active')
                ->whereNotNull('commission_liquidation_id');

            if ($detail->movement_detail_id) {
                $fallbackLiquidatedQuery->where('id', $detail->movement_detail_id);
            }

            $hasLiquidatedCommission = $fallbackLiquidatedQuery->exists();
        }

        if ($hasLiquidatedCommission) {
            throw ValidationException::withMessages([
                'service' => 'No se puede transferir: la comisión de este servicio ya fue liquidada.',
            ]);
        }

        $newProfessional = Professional::with('commissionSettings')->findOrFail($newProfessionalId);
        $commissionPercentage = $newProfessional->commissionSettings?->commission_percentage ?? 0;

        $oldProfessional = Professional::find($oldProfessionalId);

        DB::transaction(function () use ($detail, $newProfessionalId, $commissionPercentage, $serviceRequest, $oldProfessionalId, $oldProfessional, $newProfessional, $transferReason) {
            $detail->update([
                'professional_id' => $newProfessionalId,
                'professional_commission_percentage' => $commissionPercentage,
            ]);

            // Mantener coherencia para futuras liquidaciones en movimientos no liquidados.
            $transactionUpdateQuery = Transaction::query()
                ->where('service_request_id', $serviceRequest->id)
                ->where('professional_id', $oldProfessionalId)
                ->where('type', 'INCOME')
                ->where('category', 'SERVICE_PAYMENT')
                ->where('status', 'active')
                ->whereNull('commission_liquidation_id');

            if ($detail->movement_detail_id) {
                $transactionUpdateQuery->where('id', $detail->movement_detail_id);
            }

            $transactionUpdateQuery->update([
                'professional_id' => $newProfessionalId,
            ]);

            AuditLog::logActivity(
                $detail,
                'service_transferred',
                [
                    'service_request_id' => $serviceRequest->id,
                    'old_professional_id' => $oldProfessionalId,
                    'old_professional_name' => $oldProfessional?->full_name,
                ],
                [
                    'service_request_id' => $serviceRequest->id,
                    'new_professional_id' => $newProfessional->id,
                    'new_professional_name' => $newProfessional->full_name,
                    'reason' => $transferReason,
                    'transferred_by_user_id' => auth()->id(),
                ],
                sprintf(
                    'Transferencia de servicio en solicitud #%s: %s -> %s. Motivo: %s',
                    $serviceRequest->request_number,
                    $oldProfessional?->full_name ?? 'N/A',
                    $newProfessional->full_name,
                    $transferReason ?: 'No especificado'
                )
            );
        });

        return redirect()
            ->route('medical.service-requests.show', $serviceRequest)
            ->with('message', 'Servicio transferido correctamente al nuevo profesional.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ServiceRequest $serviceRequest): Response
    {
        // Solo permitir editar si no está confirmado o pagado
        if (in_array($serviceRequest->status, [
            ServiceRequest::STATUS_PAID,
            ServiceRequest::STATUS_CANCELLED
        ])) {
            abort(403, 'No se puede editar una solicitud pagada o cancelada.');
        }

        $serviceRequest->load([
            'patient',
            'details.medicalService',
            'details.professional',
            'details.insuranceType',
        ]);

        return Inertia::render('medical/service-requests/Edit', [
            'serviceRequest' => $serviceRequest,
            'patients' => Patient::where('status', 'active')
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'document_type', 'document_number']),
            'medicalServices' => MedicalService::with('category')
                ->where('status', 'active')
                ->orderBy('name')
                ->get(),
            'professionals' => Professional::where('status', 'active')
                ->with('commissionSettings')
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(),
            'insuranceTypes' => InsuranceType::where('status', 'active')
                ->orderBy('name')
                ->get(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ServiceRequest $serviceRequest): RedirectResponse
    {
        // Solo permitir actualizar si no está pagado o cancelado
        if (in_array($serviceRequest->status, [
            ServiceRequest::STATUS_PAID,
            ServiceRequest::STATUS_CANCELLED
        ])) {
            abort(403, 'No se puede actualizar una solicitud pagada o cancelada.');
        }

        $validated = $request->validate([
            'patient_id' => ['required', 'exists:patients,id'],
            'reception_type' => ['required', Rule::in([
                ServiceRequest::RECEPTION_SCHEDULED,
                ServiceRequest::RECEPTION_WALK_IN,
                ServiceRequest::RECEPTION_EMERGENCY,
                ServiceRequest::RECEPTION_INPATIENT_DISCHARGE,
            ])],
            'priority' => ['required', Rule::in([
                ServiceRequest::PRIORITY_LOW,
                ServiceRequest::PRIORITY_NORMAL,
                ServiceRequest::PRIORITY_HIGH,
                ServiceRequest::PRIORITY_URGENT,
            ])],
            'request_date' => ['required', 'date'],
            'request_time' => ['nullable', 'date_format:H:i'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $serviceRequest->update($validated);

        return redirect()
            ->route('medical.service-requests.show', $serviceRequest)
            ->with('message', 'Solicitud de servicio actualizada exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ServiceRequest $serviceRequest): RedirectResponse
    {
        // Solo permitir eliminar si está pendiente de confirmación
        if ($serviceRequest->status !== ServiceRequest::STATUS_PENDING_CONFIRMATION) {
            abort(403, 'Solo se pueden eliminar solicitudes pendientes de confirmación.');
        }

        $serviceRequest->delete();

        return redirect()
            ->route('medical.service-requests.index')
            ->with('message', 'Solicitud de servicio eliminada exitosamente.');
    }

    /**
     * Confirm a service request.
     */
    public function confirm(ServiceRequest $serviceRequest): RedirectResponse
    {
        if ($serviceRequest->status !== ServiceRequest::STATUS_PENDING_CONFIRMATION) {
            abort(403, 'Solo se pueden confirmar solicitudes pendientes.');
        }

        DB::transaction(function () use ($serviceRequest) {
            $serviceRequest->confirm();

            $serviceRequest->appointments()
                ->where('status', ScheduleAppointment::STATUS_SCHEDULED)
                ->update([
                    'status' => ScheduleAppointment::STATUS_CHECKED_IN,
                    'checked_in_at' => now(),
                ]);
        });

        return redirect()
            ->route('medical.service-requests.show', $serviceRequest)
            ->with('message', 'Solicitud confirmada exitosamente.');
    }

    /**
     * Cancel a service request.
     */
    public function cancel(Request $request, ServiceRequest $serviceRequest)
    {
        if ($serviceRequest->isCancelled()) {
            abort(403, 'La solicitud ya está cancelada.');
        }

        // Solo permitir cancelar si está pendiente de pago
        if ($serviceRequest->payment_status !== ServiceRequest::PAYMENT_PENDING) {
            abort(403, 'Solo se pueden cancelar solicitudes pendientes de pago.');
        }

        $validated = $request->validate([
            'cancellation_reason' => ['nullable', 'string', 'max:500'],
        ]);

        // Si no se proporciona razón, usar una por defecto
        $reason = $validated['cancellation_reason'] ?? 'Cancelación solicitada desde la recepción';
        
        $serviceRequest->cancel(auth()->id(), $reason);

        $cancelledServiceRequest = $serviceRequest->fresh(['patient', 'details']);

        PendingServicePaymentCancelled::dispatch($cancelledServiceRequest);

        app(NotificationRecipientResolver::class)
            ->cashPendingServiceRecipients()
            ->each
            ->notify(new CashPendingServiceNotification(
                $cancelledServiceRequest,
                'Solicitud pendiente cancelada en recepción.',
                'pending-service-cancelled',
            ));

        // Si la solicitud es cancelada desde una petición AJAX (modal), devolver JSON
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Solicitud cancelada exitosamente.'
            ]);
        }

        return redirect()
            ->route('medical.service-requests.show', $serviceRequest)
            ->with('message', 'Solicitud cancelada exitosamente.');
    }
}
