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
    public function index(): Response
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

        $recentRequests = ServiceRequest::with([
            'patient',
            'details.medicalService',
            'details.professional'
        ])
        ->whereDate('created_at', $today)
        ->latest()
        ->take(10)
        ->get()
        ->map(function ($request) {
            return [
                'id' => $request->id,
                'request_number' => $request->request_number,
                'patient_name' => $request->patient->full_name,
                'patient_document' => $request->patient->formatted_document,
                'status' => $request->status,
                'priority' => $request->priority,
                'services_count' => $request->details->count(),
                'total_amount' => $request->total_amount,
                'created_at' => $request->created_at->format('H:i'),
            ];
        });

        return Inertia::render('medical/reception/Index', [
            'stats' => $stats,
            'recentRequests' => $recentRequests,
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
            'medicalServices' => MedicalService::with('category')
                ->where('status', 'active')
                ->orderBy('name')
                ->get()
                ->groupBy('category.name')
                ->map(function ($services, $categoryName) {
                    return [
                        'category' => $categoryName,
                        'services' => $services->map(function ($service) {
                            return [
                                'value' => $service->id,
                                'label' => $service->name . ' - $' . number_format($service->base_price, 2),
                                'name' => $service->name,
                                'code' => $service->code,
                                'base_price' => $service->base_price,
                                'estimated_duration' => $service->estimated_duration,
                            ];
                        })->values()
                    ];
                })->values(),
            'professionals' => Professional::where('status', 'active')
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name'])
                ->map(function ($professional) {
                    // Buscar la especialidad principal directamente
                    $primarySpecialty = $professional->specialties()
                        ->wherePivot('is_primary', true)
                        ->first();
                    
                    $specialtyName = $primarySpecialty ? $primarySpecialty->name : 'Sin especialidad';
                    
                    return [
                        'value' => $professional->id,
                        'label' => $professional->full_name . ' - ' . $specialtyName,
                        'full_name' => $professional->full_name,
                        'specialty' => $specialtyName,
                    ];
                }),
            'insuranceTypes' => InsuranceType::where('status', 'active')
                ->orderBy('name')
                ->get()
                ->map(function ($insurance) {
                    return [
                        'value' => $insurance->id,
                        'label' => $insurance->name . ' (' . $insurance->coverage_percentage . '% cobertura)',
                        'name' => $insurance->name,
                        'coverage_percentage' => $insurance->coverage_percentage,
                    ];
                }),
        ]);
    }
}
