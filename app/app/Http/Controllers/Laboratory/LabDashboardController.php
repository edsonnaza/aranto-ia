<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabSample;
use App\Models\Laboratory\LabResult;
use App\Models\Laboratory\LabValidation;
use Inertia\Inertia;
use Inertia\Response;

class LabDashboardController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'total_samples' => LabSample::count(),
            'pending_samples' => LabSample::where('status', 'pending')->count(),
            'total_results' => LabResult::count(),
            'pending_validations' => LabValidation::count(),
        ];

        $recentSamples = LabSample::with(['patient', 'orderedBy'])
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('laboratory/Dashboard', [
            'stats' => $stats,
            'recentSamples' => $recentSamples,
        ]);
    }
}
