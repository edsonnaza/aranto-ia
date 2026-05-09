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
        $dates = $this->resolveDashboardDates();

        $today = $dates['today'];
        $tomorrow = $dates['tomorrow'];
        $last7DaysStart = $dates['last7DaysStart'];

        $stats = $this->getDashboardStats($today, $tomorrow);
        $topServicesToday = $this->getTopServicesToday($today, $tomorrow);
        $topProfessionalsToday = $this->getTopProfessionalsToday($today, $tomorrow);
        $dailyTrend = $this->getDailyTrend($last7DaysStart, $tomorrow);
        $paymentStatusToday = $this->getPaymentStatusToday($today, $tomorrow);
        $recentRequests = $this->getRecentRequests($today, $tomorrow);

        return Inertia::render('dashboard', [
            'stats' => $stats,
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
            'date_info' => $this->formatDateInfo($today),
        ]);
    }

    /**
     * @return array{today: Carbon, tomorrow: Carbon, last7DaysStart: Carbon}
     */
    private function resolveDashboardDates(): array
    {
        return [
            'today' => Carbon::today(),
            'tomorrow' => Carbon::tomorrow(),
            'last7DaysStart' => Carbon::today()->subDays(6)->startOfDay(),
        ];
    }

    /**
     * @return array{patients_attended_today: int, patients_by_insurance_today: int, patients_particular_today: int, service_requests_today: int, active_income_transactions_today: int, open_cash_sessions: int}
     */
    private function getDashboardStats(Carbon $today, Carbon $tomorrow): array
    {
        $patientsScheduledToday = ScheduleAppointment::query()
            ->whereDate('appointment_date', $today)
            ->where('status', ScheduleAppointment::STATUS_SCHEDULED)
            ->distinct('patient_id')
            ->count('patient_id');

        $patientsByInsuranceToday = DB::table('service_requests')
            ->join('patients', 'service_requests.patient_id', '=', 'patients.id')
            ->join('patient_insurances', 'patients.id', '=', 'patient_insurances.patient_id')
            ->join('insurance_types', 'patient_insurances.insurance_type_id', '=', 'insurance_types.id')
            ->whereBetween('service_requests.created_at', [$today, $tomorrow])
            ->where('insurance_types.name', '!=', 'Particular')
            ->distinct('service_requests.patient_id')
            ->count('service_requests.patient_id');

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

        $serviceRequestsToday = ServiceRequest::whereBetween('created_at', [$today, $tomorrow])->count();

        $activeIncomeTransactionsToday = Transaction::query()
            ->active()
            ->income()
            ->whereBetween('created_at', [$today, $tomorrow])
            ->count();

        $openCashSessions = CashRegisterSession::query()->open()->count();

        return [
            'patients_attended_today' => $patientsScheduledToday,
            'patients_by_insurance_today' => $patientsByInsuranceToday,
            'patients_particular_today' => $patientsParticularToday,
            'service_requests_today' => $serviceRequestsToday,
            'active_income_transactions_today' => $activeIncomeTransactionsToday,
            'open_cash_sessions' => $openCashSessions,
        ];
    }

    private function getTopServicesToday(Carbon $today, Carbon $tomorrow)
    {
        return DB::table('service_request_details')
            ->join('medical_services', 'service_request_details.medical_service_id', '=', 'medical_services.id')
            ->join('service_requests', 'service_request_details.service_request_id', '=', 'service_requests.id')
            ->whereBetween('service_requests.created_at', [$today, $tomorrow])
            ->select('medical_services.name', DB::raw('COUNT(service_request_details.id) as count'))
            ->groupBy('medical_services.id', 'medical_services.name')
            ->orderByDesc('count')
            ->limit(10)
            ->get();
    }

    private function getTopProfessionalsToday(Carbon $today, Carbon $tomorrow)
    {
        return DB::table('service_request_details')
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
    }

    /**
     * @return array<int, array{date: string, label: string, patients: int, income: float}>
     */
    private function getDailyTrend(Carbon $last7DaysStart, Carbon $tomorrow): array
    {
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

        return collect(range(0, 6))->map(function (int $offset) use ($last7DaysStart, $patientsTrendRaw, $incomeTrendRaw) {
            $date = $last7DaysStart->copy()->addDays($offset);
            $key = $date->toDateString();

            return [
                'date' => $key,
                'label' => $date->locale('es')->isoFormat('dd D'),
                'patients' => (int) ($patientsTrendRaw[$key] ?? 0),
                'income' => (float) ($incomeTrendRaw[$key] ?? 0),
            ];
        })->toArray();
    }

    /**
     * @return array<int, array{status: mixed, count: int}>
     */
    private function getPaymentStatusToday(Carbon $today, Carbon $tomorrow): array
    {
        return ServiceRequest::query()
            ->whereBetween('created_at', [$today, $tomorrow])
            ->selectRaw('payment_status, COUNT(*) as count')
            ->groupBy('payment_status')
            ->get()
            ->map(fn ($row) => [
                'status' => $row->payment_status,
                'count' => (int) $row->count,
            ])
            ->toArray();
    }

    /**
     * @return array<int, array{id: int, request_number: string, patient: string, total_amount: float, paid_amount: float, payment_status: string, created_at: string|null}>
     */
    private function getRecentRequests(Carbon $today, Carbon $tomorrow): array
    {
        return ServiceRequest::query()
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
    }

    /**
     * @return array{date: string, day_name: string, formatted_date: string}
     */
    private function formatDateInfo(Carbon $today): array
    {
        return [
            'date' => $today->format('Y-m-d'),
            'day_name' => $today->translatedFormat('l'),
            'formatted_date' => $today->translatedFormat('d \d\e F \d\e Y'),
        ];
    }
}
