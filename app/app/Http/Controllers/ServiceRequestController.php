<?php

namespace App\Http\Controllers;

use App\Models\ServiceRequest;
use App\Models\Patient;
use App\Models\MedicalService;
use App\Models\Professional;
use App\Models\InsuranceType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;

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
            'services.*.professional_id' => ['required', 'exists:professionals,id'],
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

        // Crear la solicitud de servicio
        $serviceRequest = ServiceRequest::create([
            'patient_id' => $validated['patient_id'],
            'created_by' => auth()->id(),
            'request_date' => $validated['request_date'],
            'request_time' => $validated['request_time'],
            'reception_type' => $validated['reception_type'],
            'priority' => $validated['priority'],
            'notes' => $validated['notes'],
            'status' => ServiceRequest::STATUS_PENDING_CONFIRMATION,
            'payment_status' => ServiceRequest::PAYMENT_PENDING,
            'total_amount' => 0, // Se calculará automáticamente
            'paid_amount' => 0,
        ]);

        // Crear los detalles de servicios
        foreach ($validated['services'] as $serviceData) {
            $serviceRequest->details()->create([
                'medical_service_id' => $serviceData['medical_service_id'],
                'professional_id' => $serviceData['professional_id'],
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
                'status' => \App\Models\ServiceRequestDetail::STATUS_PENDING,
            ]);
        }

        return redirect()
            ->route('medical.service-requests.show', $serviceRequest)
            ->with('message', 'Solicitud de servicio creada exitosamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(ServiceRequest $serviceRequest): Response
    {
        $serviceRequest->load([
            'patient.insurances.insuranceType',
            'createdBy',
            'cancelledBy',
            'details.medicalService.category',
            'details.professional',
            'details.insuranceType',
        ]);

        return Inertia::render('medical/service-requests/Show', [
            'serviceRequest' => [
                'id' => $serviceRequest->id,
                'request_number' => $serviceRequest->request_number,
                'patient' => [
                    'id' => $serviceRequest->patient->id,
                    'full_name' => $serviceRequest->patient->full_name,
                    'formatted_document' => $serviceRequest->patient->formatted_document,
                    'email' => $serviceRequest->patient->email,
                    'phone' => $serviceRequest->patient->phone,
                    'insurance_info' => $serviceRequest->patient->insurance_info,
                ],
                'request_date' => $serviceRequest->request_date->format('Y-m-d'),
                'request_time' => $serviceRequest->request_time,
                'status' => $serviceRequest->status,
                'reception_type' => $serviceRequest->reception_type,
                'priority' => $serviceRequest->priority,
                'notes' => $serviceRequest->notes,
                'total_amount' => $serviceRequest->total_amount,
                'paid_amount' => $serviceRequest->paid_amount,
                'remaining_amount' => $serviceRequest->remaining_amount,
                'payment_status' => $serviceRequest->payment_status,
                'created_by' => $serviceRequest->createdBy->name,
                'confirmed_at' => $serviceRequest->confirmed_at?->format('Y-m-d H:i'),
                'cancelled_at' => $serviceRequest->cancelled_at?->format('Y-m-d H:i'),
                'cancelled_by' => $serviceRequest->cancelledBy?->name,
                'cancellation_reason' => $serviceRequest->cancellation_reason,
                'created_at' => $serviceRequest->created_at->format('Y-m-d H:i'),
                'details' => $serviceRequest->details->map(function ($detail) {
                    return [
                        'id' => $detail->id,
                        'medical_service' => [
                            'id' => $detail->medicalService->id,
                            'name' => $detail->medicalService->name,
                            'code' => $detail->medicalService->code,
                            'category' => $detail->medicalService->category->name,
                        ],
                        'professional' => [
                            'id' => $detail->professional->id,
                            'full_name' => $detail->professional->full_name,
                            'specialty' => $detail->professional->specialty,
                        ],
                        'insurance_type' => [
                            'id' => $detail->insuranceType->id,
                            'name' => $detail->insuranceType->name,
                            'coverage_percentage' => $detail->insuranceType->coverage_percentage,
                        ],
                        'scheduled_date' => $detail->scheduled_date?->format('Y-m-d'),
                        'scheduled_time' => $detail->scheduled_time,
                        'estimated_duration' => $detail->estimated_duration,
                        'unit_price' => $detail->unit_price,
                        'quantity' => $detail->quantity,
                        'subtotal' => $detail->subtotal,
                        'discount_percentage' => $detail->discount_percentage,
                        'discount_amount' => $detail->discount_amount,
                        'total_amount' => $detail->total_amount,
                        'status' => $detail->status,
                        'paid_at' => $detail->paid_at?->format('Y-m-d H:i'),
                        'preparation_instructions' => $detail->preparation_instructions,
                        'notes' => $detail->notes,
                    ];
                }),
            ],
        ]);
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

        $serviceRequest->confirm();

        return redirect()
            ->route('medical.service-requests.show', $serviceRequest)
            ->with('message', 'Solicitud confirmada exitosamente.');
    }

    /**
     * Cancel a service request.
     */
    public function cancel(Request $request, ServiceRequest $serviceRequest): RedirectResponse
    {
        if ($serviceRequest->isCancelled()) {
            abort(403, 'La solicitud ya está cancelada.');
        }

        $validated = $request->validate([
            'cancellation_reason' => ['required', 'string', 'max:500'],
        ]);

        $serviceRequest->cancel(auth()->id(), $validated['cancellation_reason']);

        return redirect()
            ->route('medical.service-requests.show', $serviceRequest)
            ->with('message', 'Solicitud cancelada exitosamente.');
    }
}
