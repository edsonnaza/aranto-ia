<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabSample;
use App\Models\Laboratory\LabResult;
use App\Models\Laboratory\LabValidation;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LabDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $totalSamples = LabSample::count();
        $samplesInAnalysis = LabSample::whereIn('status', ['in_analysis', 'processing'])->count();
        $samplesPendingValidation = LabSample::where('status', 'pending_validation')->count();
        $validatedToday = LabValidation::whereDate('validated_at', now()->toDateString())->count();

        $statusLabels = [
            'pending' => 'Pendiente',
            'pending_collection' => 'Pendiente toma',
            'collected' => 'Tomada',
            'received' => 'Recibida',
            'processing' => 'Procesando',
            'in_analysis' => 'En análisis',
            'pending_validation' => 'Pendiente validación',
            'validated' => 'Validada',
            'reported' => 'Informada',
            'completed' => 'Completada',
            'rejected' => 'Rechazada',
            'cancelled' => 'Cancelada',
        ];

        $statusTotals = LabSample::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $statusDistribution = collect($statusLabels)
            ->map(function ($label, $status) use ($statusTotals) {
                return [
                    'status' => $status,
                    'label' => $label,
                    'total' => (int) ($statusTotals[$status] ?? 0),
                ];
            })
            ->filter(fn ($row) => $row['total'] > 0)
            ->values()
            ->all();

        $topServices = DB::table('lab_samples as ls')
            ->join('service_request_details as srd', 'srd.id', '=', 'ls.service_request_detail_id')
            ->join('medical_services as ms', 'ms.id', '=', 'srd.medical_service_id')
            ->select('ms.name as service_name', DB::raw('COUNT(ls.id) as total'))
            ->groupBy('ms.id', 'ms.name')
            ->orderByDesc('total')
            ->limit(6)
            ->get();

        $startDate = now()->subDays(6)->startOfDay();
        $trendTotals = LabSample::query()
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('COUNT(*) as total'))
            ->where('created_at', '>=', $startDate)
            ->groupBy('day')
            ->pluck('total', 'day');

        $dailyTrend = collect(range(0, 6))
            ->map(function ($offset) use ($trendTotals, $startDate) {
                $date = $startDate->copy()->addDays($offset);
                $key = $date->toDateString();

                return [
                    'date' => $key,
                    'label' => $date->format('d/m'),
                    'total' => (int) ($trendTotals[$key] ?? 0),
                ];
            })
            ->values()
            ->all();

        $latestRequests = LabSample::query()
            ->with(['patient', 'serviceRequestDetail.medicalService'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(function (LabSample $sample) {
                return [
                    'id' => $sample->id,
                    'sample_number' => $sample->sample_number,
                    'status' => $sample->status,
                    'created_at' => optional($sample->created_at)?->toDateTimeString(),
                    'patient_name' => $sample->patient?->full_name,
                    'service_name' => $sample->serviceRequestDetail?->medicalService?->name,
                ];
            })
            ->values();

        $stats = [
            'total_samples' => $totalSamples,
            'in_analysis_samples' => $samplesInAnalysis,
            'pending_validation_samples' => $samplesPendingValidation,
            'validated_today' => $validatedToday,
            'total_results' => LabResult::count(),
            'total_validations' => LabValidation::count(),
        ];

        return Inertia::render('laboratory/Dashboard', [
            'stats' => $stats,
            'statusDistribution' => $statusDistribution,
            'topServices' => $topServices,
            'dailyTrend' => $dailyTrend,
            'latestRequests' => $latestRequests,
        ]);
    }
}
