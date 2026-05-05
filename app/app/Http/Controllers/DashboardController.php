<?php

namespace App\Http\Controllers;

use App\Models\ServiceRequest;
use App\Models\CashRegisterSession;
use App\Models\ScheduleAppointment;
use App\Models\Transaction;
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
        $last7DaysStart = Carbon::today()->subDays(6)->startOfDay();

        // 1. Unique patients with scheduled appointments today
        $patientsScheduledToday = ScheduleAppointment::query()
            ->whereDate('appointment_date', $today)
            ->where('status', ScheduleAppointment::STATUS_SCHEDULED)
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

        // 4. Service requests created today
        $serviceRequestsToday = ServiceRequest::whereBetween('created_at', [$today, $tomorrow])->count();

        // 5. Active income transactions today (non-sensitive KPI)
        $activeIncomeTransactionsToday = Transaction::query()
            ->active()
            ->income()
            ->whereBetween('created_at', [$today, $tomorrow])
            ->count();

        // 6. Open cash register sessions
        $openCashSessions = CashRegisterSession::query()->open()->count();

        // 7. Top 10 services today
        $topServicesToday = DB::table('service_request_details')
            ->join('medical_services', 'service_request_details.medical_service_id', '=', 'medical_services.id')
            ->join('service_requests', 'service_request_details.service_request_id', '=', 'service_requests.id')
            ->whereBetween('service_requests.created_at', [$today, $tomorrow])
            ->select('medical_services.name', DB::raw('COUNT(service_request_details.id) as count'))
            ->groupBy('medical_services.id', 'medical_services.name')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        // 8. Top 10 professionals today
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

        // 9. Daily trend (last 7 days): distinct patients + income
        $patientsTrendRaw = DB::table('service_requests')
            ->selectRaw('DATE(created_at) as day, COUNT(DISTINCT patient_id) as patients_count')
            ->whereBetween('created_at', [$last7DaysStart, $tomorrow])
            ->groupBy('day')
            ->pluck('patients_count', 'day');

        $incomeTrendRaw = DB::table('transactions')
            ->selectRaw('DATE(created_at) as day, COALESCE(SUM(amount), 0) as total_income')
            ->where('status', 'active')
            ->where('type', 'INCOME')
            ->whereBetween('created_at', [$last7DaysStart, $tomorrow])
            ->groupBy('day')
            ->pluck('total_income', 'day');

        $dailyTrend = collect(range(0, 6))->map(function (int $offset) use ($last7DaysStart, $patientsTrendRaw, $incomeTrendRaw) {
            $date = $last7DaysStart->copy()->addDays($offset);
            $key = $date->toDateString();

            return [
                'date' => $key,
                'label' => $date->locale('es')->isoFormat('dd D'),
                'patients' => (int) ($patientsTrendRaw[$key] ?? 0),
                'income' => (float) ($incomeTrendRaw[$key] ?? 0),
            ];
        })->toArray();

        // 10. Payment status split for today
        $paymentStatusToday = ServiceRequest::query()
            ->whereBetween('created_at', [$today, $tomorrow])
            ->selectRaw('payment_status, COUNT(*) as count')
            ->groupBy('payment_status')
            ->get()
            ->map(fn ($row) => [
                'status' => $row->payment_status,
                'count' => (int) $row->count,
            ])
            ->toArray();

        // 11. Recent requests (today)
        $recentRequests = ServiceRequest::query()
            ->with('patient:id,first_name,last_name')
            ->whereBetween('created_at', [$today, $tomorrow])
            ->latest('created_at')
            ->limit(8)
            ->get()
            ->map(fn (ServiceRequest $request) => [
                'id' => $request->id,
                'request_number' => $request->request_number,
                'patient' => trim(($request->patient?->first_name ?? '').' '.($request->patient?->last_name ?? '')),
                'total_amount' => (float) $request->total_amount,
                'paid_amount' => (float) $request->paid_amount,
                'payment_status' => $request->payment_status,
                'created_at' => $request->created_at?->format('H:i'),
            ])
            ->toArray();

        return Inertia::render('dashboard', [
            'stats' => [
                'patients_attended_today' => $patientsScheduledToday,
                'patients_by_insurance_today' => $patientsByInsuranceToday,
                'patients_particular_today' => $patientsParticularToday,
                'service_requests_today' => $serviceRequestsToday,
                'active_income_transactions_today' => $activeIncomeTransactionsToday,
                'open_cash_sessions' => $openCashSessions,
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
                'daily_trend' => $dailyTrend,
                'payment_status_today' => $paymentStatusToday,
            ],
            'recent_requests' => $recentRequests,
            'date_info' => [
                'date' => $today->format('Y-m-d'),
                'day_name' => $today->translatedFormat('l'),
                'formatted_date' => $today->translatedFormat('d \d\e F \d\e Y'),
            ],
        ]);
    }
}
