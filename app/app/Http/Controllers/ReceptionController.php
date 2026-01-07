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
use Carbon\Carbon;

class ReceptionController extends Controller
{
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

        // Server-side paginated table for requests (last 7 days by default, supports ?page & ?per_page & ?search)
        $perPage = (int) $request->get('per_page', 10);
        $search = $request->get('search');
        $dateFrom = $request->get('date_from', Carbon::today()->subDays(6)->toDateString());
        $dateTo = $request->get('date_to', Carbon::today()->toDateString());

        $requestsQuery = ServiceRequest::with(['patient', 'details'])
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
                return [
                    'id' => $request->id,
                    'request_number' => $request->request_number,
                    'patient_name' => $request->patient->full_name,
                    'patient_document' => $request->patient->formatted_document,
                    'status' => $request->status,
                    'priority' => $request->priority,
                    'services_count' => $request->details->count(),
                    'total_amount' => $request->total_amount,
                    'request_date' => $request->request_date->format('d/m/Y'),
                    'created_at' => $request->created_at->format('H:i'),
                ];
            });

        return Inertia::render('medical/reception/Index', [
            'stats' => $stats,
            'requests' => $requests,
        ]);
    }

    /**
     * Show the new service request form (cart interface).
     */
    public function create(): Response
    {
        return Inertia::render('medical/reception/Create', [
            'patients' => Patient::where('status', 'active')
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'document_type', 'document_number'])
                ->map(function ($patient) {
                    return [
                        'value' => $patient->id,
                        'label' => $patient->full_name . ' - ' . $patient->formatted_document,
                        'full_name' => $patient->full_name,
                        'document' => $patient->formatted_document,
                    ];
                }),
            'medicalServices' => MedicalService::where('status', 'active')
                ->orderBy('name')
                ->get()
                ->map(function ($service) {
                    return [
                        'id' => $service->id,
                        'name' => $service->name,
                        'code' => $service->code,
                        'description' => $service->description,
                        'category_id' => $service->category_id,
                        'category_name' => $service->category?->name,
                        'duration_minutes' => $service->duration_minutes,
                        'requires_appointment' => $service->requires_appointment,
                        'requires_preparation' => $service->requires_preparation,
                        'status' => $service->status,
                    ];
                }),
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
     * Get service price by insurance type
     */
    public function getServicePrice(Request $request)
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:medical_services,id',
            'insurance_type_id' => 'required|exists:insurance_types,id',
        ]);

        $service = MedicalService::find($validated['service_id']);
        
        // Buscar precio específico para el seguro
        $servicePrice = $service->currentPrices()
            ->where('insurance_type_id', $validated['insurance_type_id'])
            ->first();

        if ($servicePrice) {
            return response()->json([
                'price' => $servicePrice->price,
                'found' => true,
                'source' => 'insurance_specific'
            ]);
        }

        // Si no hay precio específico, retornar null (no hay fallback a base_price)
        return response()->json([
            'price' => null,
            'found' => false,
            'source' => 'not_found'
        ]);
    }
}
