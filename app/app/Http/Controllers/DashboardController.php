<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\Professional;
use App\Models\ServiceRequest;
use App\Models\MedicalService;
use App\Models\InsuranceType;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Display the main dashboard with operational statistics
     */
    public function index(): Response
    {
        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();

        // 1. Patients attended today
        $patientsAttendedToday = ServiceRequest::whereBetween('created_at', [$today, $tomorrow])
            ->distinct('patient_id')
            ->count('patient_id');

        // 2. Patients by insurance type (not "Particular") today
        $patientsByInsuranceToday = DB::table('service_requests')
            ->join('patients', 'service_requests.patient_id', '=', 'patients.id')
            ->join('patient_insurances', 'patients.id', '=', 'patient_insurances.patient_id')
            ->join('insurance_types', 'patient_insurances.insurance_type_id', '=', 'insurance_types.id')
            ->whereBetween('service_requests.created_at', [$today, $tomorrow])
            ->where('insurance_types.name', '!=', 'Particular')
            ->distinct('service_requests.patient_id')
            ->count('service_requests.patient_id');

        // 3. Private/Particular patients today
        $patientsParticularToday = DB::table('service_requests')
            ->join('patients', 'service_requests.patient_id', '=', 'patients.id')
            ->leftJoin('patient_insurances', 'patients.id', '=', 'patient_insurances.patient_id')
            ->whereBetween('service_requests.created_at', [$today, $tomorrow])
            ->where(function ($query) {
                $query->whereNull('patient_insurances.id')
                    ->orWhereIn('patient_insurances.insurance_type_id', function ($subquery) {
                        $subquery->select('id')
                            ->from('insurance_types')
                            ->where('name', 'Particular');
                    });
            })
            ->distinct('service_requests.patient_id')
            ->count('service_requests.patient_id');

        // 4. Top 10 services today
        $topServicesToday = DB::table('service_request_details')
            ->join('medical_services', 'service_request_details.medical_service_id', '=', 'medical_services.id')
            ->join('service_requests', 'service_request_details.service_request_id', '=', 'service_requests.id')
            ->whereBetween('service_requests.created_at', [$today, $tomorrow])
            ->select('medical_services.name', DB::raw('COUNT(service_request_details.id) as count'))
            ->groupBy('medical_services.id', 'medical_services.name')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        // 5. Top 10 professionals today
        $topProfessionalsToday = DB::table('service_request_details')
            ->join('professionals', 'service_request_details.professional_id', '=', 'professionals.id')
            ->join('service_requests', 'service_request_details.service_request_id', '=', 'service_requests.id')
            ->whereBetween('service_requests.created_at', [$today, $tomorrow])
            ->select(
                DB::raw("CONCAT(professionals.first_name, ' ', professionals.last_name) as name"),
                DB::raw('COUNT(service_request_details.id) as count')
            )
            ->groupBy('professionals.id', 'professionals.first_name', 'professionals.last_name')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        return Inertia::render('dashboard', [
            'stats' => [
                'patients_attended_today' => $patientsAttendedToday,
                'patients_by_insurance_today' => $patientsByInsuranceToday,
                'patients_particular_today' => $patientsParticularToday,
            ],
            'charts' => [
                'top_services_today' => $topServicesToday->map(fn ($item) => [
                    'name' => $item->name,
                    'count' => $item->count,
                ])->toArray(),
                'top_professionals_today' => $topProfessionalsToday->map(fn ($item) => [
                    'name' => $item->name,
                    'count' => $item->count,
                ])->toArray(),
            ],
            'date_info' => [
                'date' => $today->format('Y-m-d'),
                'day_name' => $today->translatedFormat('l'),
                'formatted_date' => $today->translatedFormat('d \d\e F \d\e Y'),
            ],
        ]);
    }
}
