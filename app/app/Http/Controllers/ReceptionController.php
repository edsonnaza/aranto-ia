<?php

namespace App\Http\Controllers;

use App\Models\ServiceRequest;
use App\Models\MedicalService;
use App\Models\Professional;
use App\Models\InsuranceType;
use App\Models\ScheduleAppointment;
use App\Models\ServiceCategory;
use App\Models\ConsultationQueue;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class ReceptionController extends Controller
{
    /**
     * Get reception statistics for dashboard cards.
     * API endpoint that returns JSON data for the frontend hook.
     */
    public function stats(Request $request)
    {
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        
        // Total requests
        $totalRequestsQuery = ServiceRequest::query();
        if ($dateFrom) {
            $totalRequestsQuery->whereDate('request_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $totalRequestsQuery->whereDate('request_date', '<=', $dateTo);
        }
        $totalRequests = $totalRequestsQuery->count();
        
        // Count of pending payment requests (remaining_amount > 0)
        $totalPendingCountQuery = ServiceRequest::query();
        if ($dateFrom) {
            $totalPendingCountQuery->whereDate('request_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $totalPendingCountQuery->whereDate('request_date', '<=', $dateTo);
        }
        $totalPendingCount = $totalPendingCountQuery->whereRaw('(total_amount - paid_amount) > 0')->count();
        
        // Count of paid requests (fully paid)
        $totalPaidCountQuery = ServiceRequest::query();
        if ($dateFrom) {
            $totalPaidCountQuery->whereDate('request_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $totalPaidCountQuery->whereDate('request_date', '<=', $dateTo);
        }
        $totalPaidCount = $totalPaidCountQuery->whereRaw('(total_amount - paid_amount) <= 0')->count();

        $stats = [
            'total_requests' => $totalRequests,
            'total_pending_count' => $totalPendingCount,
            'total_paid_count' => $totalPaidCount,
        ];

        // If it's an AJAX request, return JSON
        if ($request->wantsJson() || $request->isXmlHttpRequest()) {
            return response()->json(['stats' => $stats]);
        }

        // Otherwise return Inertia response
        return Inertia::render('DummyComponent', [
            'stats' => $stats
        ]);
    }

    /**
     * Show the reception dashboard.
     */
    public function index(Request $request): Response
    {
        $today = Carbon::today();
        
        $stats = [
            'pending_requests' => ServiceRequest::whereDate('request_date', $today)
                ->where('status', ServiceRequest::STATUS_PENDING_CONFIRMATION)
                ->count(),
            'confirmed_requests' => ServiceRequest::whereDate('request_date', $today)
                ->where('status', ServiceRequest::STATUS_CONFIRMED)
                ->count(),
            'in_progress_requests' => ServiceRequest::whereDate('request_date', $today)
                ->where('status', ServiceRequest::STATUS_IN_PROGRESS)
                ->count(),
            'completed_requests' => ServiceRequest::whereDate('request_date', $today)
                ->whereIn('status', [ServiceRequest::STATUS_PAID, ServiceRequest::STATUS_PENDING_PAYMENT])
                ->count(),
        ];

        // Server-side paginated table for requests
        $perPage = (int) $request->get('per_page', 10);
        $search = $request->get('search');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        // If no date filters provided, default to today
        if (!$dateFrom) {
            $dateFrom = Carbon::today()->toDateString();
        }
        if (!$dateTo) {
            $dateTo = Carbon::today()->toDateString();
        }

        $requestsQuery = ServiceRequest::with(['patient.insuranceType', 'details.professional', 'details.insuranceType'])
            ->whereBetween('request_date', [$dateFrom, $dateTo]);

        if ($search) {
            $requestsQuery->where(function ($q) use ($search) {
                $q->where('request_number', 'like', "%{$search}%")
                  ->orWhereHas('patient', function ($qp) use ($search) {
                      $qp->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%")
                         ->orWhereRaw("concat(first_name, ' ', last_name) like ?", ["%{$search}%"])
                         ->orWhere('document_number', 'like', "%{$search}%");
                  });
            });
        }

        $requests = $requestsQuery->latest('created_at')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function ($request) {
                // Get unique professional names from details
                $professionalNames = $request->details
                    ->pluck('professional.full_name')
                    ->filter()
                    ->unique()
                    ->implode(', ');

                // Get unique insurance types from service details
                $insuranceNames = $request->details
                    ->pluck('insuranceType.name')
                    ->filter()
                    ->unique()
                    ->implode(', ');

                // Check if there's an active queue entry for this reception
                $queued = ConsultationQueue::where('reception_id', $request->id)
                    ->whereIn('status', ['waiting', 'called', 'in_consultation'])
                    ->latest('created_at')
                    ->first();

                $queueDoctorId = null;
                $queueDoctorName = null;
                $queueStatus = null;
                $queuePriority = null;

                if ($queued) {
                    $queueDoctorId = $queued->doctor_id;
                    $queueDoctorName = \App\Models\User::find($queueDoctorId)?->name ?? null;
                    $queueStatus = $queued->status;
                    $queuePriority = $queued->priority;
                }

                return [
                    'id' => $request->id,
                    'request_number' => $request->request_number,
                    'patient_name' => $request->patient->full_name,
                    'patient_document' => $request->patient->formatted_document,
                    'status' => $request->status,
                    'priority' => $request->priority,
                    'reception_type' => $request->reception_type,
                    'services_count' => $request->details->count(),
                    'total_amount' => $request->total_amount,
                    'paid_amount' => $request->paid_amount,
                    'request_date' => $request->request_date->format('d/m/Y'),
                    'created_at' => $request->created_at->format('H:i'),
                    'insurance_type_name' => $insuranceNames ?: 'Sin seguro',
                    'payment_status' => $request->payment_status ?? 'pending',
                    'professional_names' => $professionalNames ?: 'No asignado',
                    // Primary professional (first detail) for quick defaulting in the UI
                    'primary_professional_id' => optional($request->details->first())->professional_id ?? null,
                    'primary_professional_name' => optional(optional($request->details->first())->professional)->full_name ?? null,
                    // Queue info if patient already enqueued for this reception
                    'is_queued' => (bool) $queued,
                    'queue_id' => $queued?->id ?? null,
                    'queue_doctor_id' => $queueDoctorId,
                    'queue_doctor_name' => $queueDoctorName,
                    'queue_status' => $queueStatus,
                    'queue_priority' => $queuePriority,
                ];
            });

        return Inertia::render('medical/reception/Index', [
            'stats' => $stats,
            'requests' => $requests,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    /**
     * Show the new service request form (cart interface).
     */
    public function create(): Response
    {
        $professionals = [];
        $medicalServices = [];
        $insuranceTypes = [];
        $initialContext = null;
        
        try {
            // Cargar profesionales
            $professionals = Professional::where('status', 'active')
                ->with('commissionSettings')
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get()
                ->map(function ($professional) {
                    return [
                        'value' => $professional->id,
                        'id' => $professional->id,
                        'label' => $professional->full_name,
                        'first_name' => $professional->first_name,
                        'last_name' => $professional->last_name,
                        'full_name' => $professional->full_name,
                        'document_type' => $professional->document_type,
                        'document_number' => $professional->document_number,
                        'phone' => $professional->phone,
                        'email' => $professional->email,
                        'status' => $professional->status,
                        'commission_percentage' => $professional->commissionSettings?->commission_percentage ?? $professional->commission_percentage ?? 0,
                    ];
                })->toArray();
        } catch (\Exception $e) {
            \Log::error('Error loading professionals in ReceptionController: ' . $e->getMessage());
        }

        try {
            // Cargar servicios médicos agrupados por categoría
            $medicalServices = ServiceCategory::where('status', 'active')
                ->with(['services' => function ($query) {
                    $query->where('status', 'active')->orderBy('name');
                }])
                ->orderBy('name')
                ->get()
                ->map(function ($category) {
                    return [
                        'id' => $category->id,
                        'category' => $category->name,
                        'services' => $category->services->map(function ($service) {
                            return [
                                'value' => $service->id,
                                'id' => $service->id,
                                'label' => $service->name,
                                'name' => $service->name,
                                'code' => $service->code,
                                'base_price' => $service->base_price ?? 0,
                                'estimated_duration' => $service->duration_minutes ?? 30,
                            ];
                        })->toArray(),
                    ];
                })->toArray();
        } catch (\Exception $e) {
            \Log::error('Error loading medical services in ReceptionController: ' . $e->getMessage());
        }

        try {
            // Cargar tipos de seguros
            $insuranceTypes = InsuranceType::where('status', 'active')
                ->orderBy('name')
                ->get()
                ->map(function ($insurance) {
                    return [
                        'value' => $insurance->id,
                        'id' => $insurance->id,
                        'label' => $insurance->name,
                        'name' => $insurance->name,
                        'description' => $insurance->description,
                        'coverage_percentage' => $insurance->coverage_percentage,
                    ];
                })->toArray();
        } catch (\Exception $e) {
            \Log::error('Error loading insurance types in ReceptionController: ' . $e->getMessage());
        }

        $appointmentId = request()->integer('appointment_id');

        if ($appointmentId) {
            $appointment = ScheduleAppointment::with(['patient.insurances', 'patient.insuranceType', 'professional', 'medicalService'])
                ->find($appointmentId);

            if ($appointment) {
                $defaultInsurance = null;

                if ($appointment->patient) {
                    $defaultInsurance = $appointment->patient->insurances
                        ->filter(function ($insurance) {
                            $validUntil = $insurance->pivot->valid_until;

                            return empty($validUntil) || Carbon::parse((string) $validUntil)->endOfDay()->gte(now());
                        })
                        ->sortByDesc(fn ($insurance) => (int) $insurance->pivot->is_primary)
                        ->first();

                    if (!$defaultInsurance && $appointment->patient->insuranceType) {
                        $defaultInsurance = $appointment->patient->insuranceType;
                    }
                }

                $serviceIds = collect($appointment->medical_service_ids ?? [])
                    ->when($appointment->medical_service_id, fn ($collection) => $collection->prepend((int) $appointment->medical_service_id))
                    ->filter()
                    ->map(fn ($serviceId) => (int) $serviceId)
                    ->unique()
                    ->values();

                $services = MedicalService::query()
                    ->whereIn('id', $serviceIds->all())
                    ->get(['id', 'name', 'duration_minutes'])
                    ->map(fn ($service) => [
                        'id' => $service->id,
                        'name' => $service->name,
                        'duration_minutes' => $service->duration_minutes,
                    ])
                    ->values()
                    ->all();

                $initialContext = [
                    'appointment' => [
                        'id' => $appointment->id,
                        'status' => $appointment->status,
                        'professional_id' => $appointment->professional_id,
                        'professional_name' => $appointment->professional?->full_name,
                        'medical_service_name' => collect($services)->pluck('name')->implode(', '),
                        'medical_service_ids' => $serviceIds->all(),
                        'medical_service_names' => collect($services)->pluck('name')->values()->all(),
                        'services' => $services,
                    ],
                    'patient' => $appointment->patient ? [
                        'id' => $appointment->patient->id,
                        'name' => $appointment->patient->full_name,
                        'default_insurance_type_id' => $defaultInsurance?->id,
                        'default_insurance_name' => $defaultInsurance?->name,
                    ] : null,
                    'request_date' => $appointment->appointment_date?->format('Y-m-d'),
                    'request_time' => $appointment->start_time
                        ? Carbon::parse((string) $appointment->start_time)->format('H:i')
                        : null,
                    'notes' => $appointment->notes,
                ];
            }
        }

        return Inertia::render('medical/reception/Create', [
            'patients' => [],
            'medicalServices' => $medicalServices,
            'professionals' => $professionals,
            'insuranceTypes' => $insuranceTypes,
            'initialContext' => $initialContext,
        ]);
    }

    /**
     * Obtener servicios médicos agrupados por categoría
     */
    private function getMedicalServicesGroupedByCategory()
    {
        try {
            $categories = ServiceCategory::where('status', 'active')
                ->with(['services' => function ($query) {
                    $query->where('status', 'active')->orderBy('name');
                }])
                ->orderBy('name')
                ->get();

            return $categories->map(function ($category) {
                return [
                    'id' => $category->id,
                    'category' => $category->name,
                    'services' => $category->services->map(function ($service) {
                        return [
                            'id' => $service->id,
                            'name' => $service->name,
                            'code' => $service->code,
                            'base_price' => $service->base_price ?? 0,
                            'estimated_duration' => $service->duration_minutes ?? 30,
                        ];
                    })->toArray(),
                ];
            })->toArray();
        } catch (\Exception $e) {
            \Log::error('Error getting medical services: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Obtener profesionales activos con comisiones
     */
    private function getActiveProfessionals()
    {
        try {
            return Professional::where('status', 'active')
                ->with('commissionSettings')
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get()
                ->map(function ($professional) {
                    return [
                        'id' => $professional->id,
                        'first_name' => $professional->first_name,
                        'last_name' => $professional->last_name,
                        'full_name' => $professional->full_name,
                        'document_type' => $professional->document_type,
                        'document_number' => $professional->document_number,
                        'phone' => $professional->phone,
                        'email' => $professional->email,
                        'status' => $professional->status,
                        'commission_percentage' => $professional->commissionSettings?->commission_percentage ?? $professional->commission_percentage ?? 0,
                    ];
                })->toArray();
        } catch (\Exception $e) {
            \Log::error('Error getting professionals: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get service price by insurance type
     */
    public function getServicePrice(Request $request)
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:medical_services,id',
            'insurance_type_id' => 'required|exists:insurance_types,id',
        ]);

        $service = MedicalService::find($validated['service_id']);
        
        // Buscar precio específico para el seguro en service_prices
        // currentPrices() now includes fallback to most recent price if no valid date range
        $servicePrice = $service->currentPrices()
            ->where('insurance_type_id', $validated['insurance_type_id'])
            ->orderByDesc('effective_from')
            ->first();

        if ($servicePrice && $servicePrice->price > 0) {
            return response()->json([
                'price' => (float) $servicePrice->price,
                'found' => true,
                'source' => 'insurance_specific'
            ]);
        }

        // Fallback al precio base del servicio si no hay precio específico
        return response()->json([
            'price' => (float) ($service->base_price ?? 0),
            'found' => true,
            'source' => 'base_price'
        ]);
    }

    /**
     * Send a paid (or authorised) service request to the consultorio queue.
     * Expected payload: doctor_id (required), priority (optional)
     */
    public function sendToConsultorio(ServiceRequest $serviceRequest, Request $request)
    {
        // Accept either a user id (users.id) or a professional id (professionals.id) from the frontend.
        $validated = $request->validate([
            'doctor_id' => 'required',
            'priority' => 'nullable',
        ]);

        // Only allow if paid or sender has explicit permission
        if (!$serviceRequest->isFullyPaid() && !$request->user()->can('send-to-consultorio')) {
            return redirect()->back()->withErrors('El servicio debe estar pagado para enviarlo automáticamente a consultorio.');
        }

        $rawDoctorId = $validated['doctor_id'];
        $resolvedUserId = null;

        // If the provided id matches a User, prefer it
        $user = \App\Models\User::find($rawDoctorId);
        if ($user && method_exists($user, 'hasRole') && $user->hasRole('doctor')) {
            $resolvedUserId = $user->id;
        } else {
            // Try resolving as a Professional id -> find linked user by user_id or email
            $professional = Professional::find($rawDoctorId);
            if ($professional) {
                if (!empty($professional->user_id)) {
                    $resolvedUserId = $professional->user_id;
                } elseif (!empty($professional->email)) {
                    $linked = \App\Models\User::where('email', $professional->email)->first();
                    if ($linked && method_exists($linked, 'hasRole') && $linked->hasRole('doctor')) {
                        $resolvedUserId = $linked->id;
                    }
                }
            }
        }

        if (!$resolvedUserId) {
            return redirect()->back()->withErrors('El profesional seleccionado no es un médico válido o no está vinculado a un usuario.');
        }

        $priority = 'normal';
        if (isset($validated['priority'])) {
            $p = $validated['priority'];
            if (is_numeric($p)) {
                $priority = ((int)$p > 0) ? 'urgent' : 'normal';
            } elseif (in_array($p, ['normal', 'urgent'])) {
                $priority = $p;
            }
        }

        // Prevent duplicate entries for the same reception: update if exists.
        $existing = ConsultationQueue::where('reception_id', $serviceRequest->id)
            ->whereIn('status', ['waiting', 'called', 'in_consultation'])
            ->first();

        if ($existing) {
            if ($existing->doctor_id == $resolvedUserId && $existing->priority == $priority) {
                return redirect()->back()->with('info', 'El paciente ya está en la cola de consultorio.');
            }

            $existing->doctor_id = $resolvedUserId;
            $existing->priority = $priority;
            $existing->save();

            event(new \App\Events\PatientEnteredQueue($existing));

            return redirect()->back()->with('success', 'Entrada de cola actualizada correctamente.');
        }

        $entry = ConsultationQueue::create([
            'patient_id' => $serviceRequest->patient_id,
            'reception_id' => $serviceRequest->id,
            'doctor_id' => $resolvedUserId,
            'priority' => $priority,
            'status' => 'waiting',
        ]);

        event(new \App\Events\PatientEnteredQueue($entry));

        return redirect()->back()->with('success', 'Paciente enviado a la cola de consultorio.');
    }
}
