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
use Illuminate\Http\JsonResponse;
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
            'request_time' => $validated['request_time'] ?? null,
            'reception_type' => $validated['reception_type'],
            'priority' => $validated['priority'],
            'notes' => $validated['notes'] ?? null,
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
    public function show(ServiceRequest $serviceRequest)
    {
        $serviceRequest->load([
            'patient.insurances',
            'createdBy',
            'cancelledBy',
            'details.medicalService.category',
            'details.professional',
            'details.insuranceType',
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

        $serviceRequest->confirm();

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
