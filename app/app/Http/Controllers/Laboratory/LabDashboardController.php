<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabSample;
use App\Models\Laboratory\LabResult;
use App\Models\Laboratory\LabValidation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LabDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $query = LabSample::query();

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('sample_number', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $samples = $query
            ->with(['patient', 'sampleType', 'serviceRequestDetail.medicalService'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total_samples' => LabSample::count(),
            'pending_samples' => LabSample::whereIn('status', ['pending_collection', 'pending'])->count(),
            'total_results' => LabResult::count(),
            'pending_validations' => LabValidation::count(),
        ];

        return Inertia::render('laboratory/Dashboard', [
            'stats' => $stats,
            'samples' => $samples,
            'filters' => $request->only(['search', 'status']),
        ]);
    }
}
