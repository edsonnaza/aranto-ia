<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\Laboratory\LabReferenceRange;
use App\Models\Laboratory\LabReport;
use App\Models\Laboratory\LabResult;
use App\Models\Laboratory\LabSample;
use App\Models\Laboratory\LabTestProfile;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class LabReportController extends Controller
{
    public function index(Request $request): Response
    {
        $today = now()->toDateString();
        $dateFrom = $request->string('date_from')->toString() ?: $today;
        $dateTo = $request->string('date_to')->toString() ?: $today;

        $query = LabReport::query()
            ->with([
                'sample.patient',
                'sample.testRequests.testProfile',
                'generatedBy:id,name',
            ]);

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('report_number', 'like', "%{$search}%")
                    ->orWhereHas('sample', function ($sampleQuery) use ($search) {
                        $sampleQuery
                            ->where('sample_number', 'like', "%{$search}%")
                            ->orWhereHas('patient', function ($patientQuery) use ($search) {
                                $patientQuery
                                    ->where('first_name', 'like', "%{$search}%")
                                    ->orWhere('last_name', 'like', "%{$search}%");
                            });
                    });
            });
        }

        if ($request->filled('profile_id')) {
            $profileId = $request->integer('profile_id');
            $query->whereHas('sample.testRequests', function ($testRequestQuery) use ($profileId) {
                $testRequestQuery->where('lab_test_profile_id', $profileId);
            });
        }

        $query->whereDate('generated_at', '>=', $dateFrom);
        $query->whereDate('generated_at', '<=', $dateTo);

        $reports = $query
            ->orderByDesc('generated_at')
            ->paginate(20)
            ->through(function (LabReport $report) {
                return [
                    'id' => $report->id,
                    'report_number' => $report->report_number,
                    'generated_at' => optional($report->generated_at)->format('d/m/Y H:i'),
                    'generated_by' => $report->generatedBy
                        ? ['id' => $report->generatedBy->id, 'name' => $report->generatedBy->name]
                        : null,
                    'sample' => $report->sample
                        ? [
                            'id' => $report->sample->id,
                            'sample_number' => $report->sample->sample_number,
                            'patient' => $report->sample->patient
                                ? [
                                    'first_name' => $report->sample->patient->first_name,
                                    'last_name' => $report->sample->patient->last_name,
                                ]
                                : null,
                            'test_requests' => $report->sample->testRequests->map(fn ($request) => [
                                'id' => $request->id,
                                'test_profile' => $request->testProfile
                                    ? [
                                        'id' => $request->testProfile->id,
                                        'name' => $request->testProfile->name,
                                    ]
                                    : null,
                            ])->all(),
                        ]
                        : null,
                ];
            })
            ->withQueryString();

        return Inertia::render('laboratory/reports/Index', [
            'reports' => $reports,
            'profiles' => LabTestProfile::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'filters' => [
                'search' => $request->string('search')->toString() ?: null,
                'profile_id' => $request->string('profile_id')->toString() ?: null,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    /**
     * Publish the validated study for a sample: create the LabReport record
     * and render its PDF. Idempotent per sample.
     */
    public function publish(LabSample $sample): RedirectResponse
    {
        $hasValidated = LabResult::where('lab_sample_id', $sample->id)
            ->where('status', 'validated')
            ->exists();

        if (! $hasValidated) {
            return back()->with('error', 'El estudio debe estar validado antes de publicarlo.');
        }

        $report = LabReport::firstOrNew(['lab_sample_id' => $sample->id]);

        if (! $report->exists) {
            $report->report_number = 'LAB-'.now()->format('Ymd').'-'.str_pad((string) $sample->id, 6, '0', STR_PAD_LEFT);
            $report->generated_by = auth()->id();
            $report->generated_at = now();
            $report->pdf_path = 'lab_reports/'.$report->report_number.'.pdf';
            $report->save();
        }

        // The PDF is rendered on demand from the validated data (Railway's
        // filesystem is ephemeral), so publishing only records the report.

        return back()->with('success', 'Estudio publicado. El PDF está disponible para descargar.');
    }

    /**
     * Download the PDF for a report. Regenerates on demand if the stored file
     * is missing (Railway's filesystem is ephemeral).
     */
    public function download(LabReport $report)
    {
        if ($report->pdf_path && Storage::disk('public')->exists($report->pdf_path)) {
            return Storage::disk('public')->download($report->pdf_path, $report->report_number.'.pdf');
        }

        return $this->render($report)->download($report->report_number.'.pdf');
    }

    /**
     * Build the dompdf instance for a report from the validated data.
     */
    private function render(LabReport $report): \Barryvdh\DomPDF\PDF
    {
        $sample = $report->sample()->with([
            'patient',
            'testRequests' => fn ($q) => $q->whereHas('results', fn ($r) => $r->where('status', 'validated')),
            'testRequests.testProfile.parameters' => fn ($q) => $q->orderBy('display_order'),
            'results' => fn ($q) => $q->where('status', 'validated'),
            'validation.validatedBy',
        ])->first();

        $patient = $sample?->patient;

        $genderMap = ['M' => 'male', 'F' => 'female'];
        $patientRangeGender = $genderMap[$patient?->gender] ?? 'all';
        $age = $patient?->birth_date ? Carbon::parse($patient->birth_date)->age : null;

        $resultsByParam = ($sample?->results ?? collect())->keyBy('lab_test_parameter_id');

        $profiles = [];
        foreach ($sample?->testRequests ?? [] as $request) {
            $profile = $request->testProfile;
            if (! $profile) {
                continue;
            }

            $rows = [];
            foreach ($profile->parameters as $parameter) {
                $result = $resultsByParam->get($parameter->id);
                if (! $result) {
                    continue;
                }

                $rows[] = [
                    'name' => $parameter->name,
                    'value' => $this->formatResultValue($result->value, $parameter->parameter_type),
                    'unit' => $parameter->unit ?? '',
                    'reference' => $this->referenceFor($parameter->id, $patientRangeGender, $age),
                    'out_of_range' => (bool) $result->is_out_of_range,
                ];
            }

            if (! empty($rows)) {
                $profiles[] = ['name' => $profile->name, 'rows' => $rows];
            }
        }

        $genderLabels = ['M' => 'Masculino', 'F' => 'Femenino', 'OTHER' => 'Otro'];

        $data = [
            'report' => $report,
            'clinic' => ['name' => config('app.name', 'Aranto')],
            'patient' => [
                'name' => trim(($patient?->first_name ?? '').' '.($patient?->last_name ?? '')) ?: '—',
                'document' => $patient?->document_number ?? '—',
                'gender' => $genderLabels[$patient?->gender] ?? '—',
                'age' => $age !== null ? $age.' años' : '—',
            ],
            'sample' => [
                'number' => $sample?->sample_number ?? '—',
                'received_at' => optional($sample?->received_at ?? $sample?->collected_at)?->format('d/m/Y H:i') ?? '—',
            ],
            'profiles' => $profiles,
            'validatedBy' => $sample?->validation?->validatedBy?->name,
            'validatedAt' => optional($sample?->validation?->validated_at)?->format('d/m/Y H:i'),
            'generatedAt' => optional($report->generated_at)?->format('d/m/Y H:i') ?? now()->format('d/m/Y H:i'),
        ];

        return Pdf::loadView('lab.report', $data)->setPaper('a4');
    }

    /**
     * Resolve the best-matching reference range text for a parameter, given the
     * patient's gender and age.
     */
    private function referenceFor(int $parameterId, string $gender, ?int $age): string
    {
        $ranges = LabReferenceRange::where('lab_test_parameter_id', $parameterId)->get();

        $match = $ranges
            ->filter(fn ($r) => $r->gender === $gender || $r->gender === 'all')
            ->filter(fn ($r) => $age === null
                || (($r->age_min === null || $age >= $r->age_min) && ($r->age_max === null || $age <= $r->age_max)))
            ->sortByDesc(fn ($r) => $r->gender === $gender ? 1 : 0)
            ->first() ?? $ranges->first();

        if (! $match) {
            return '';
        }

        if ($match->reference_text) {
            return $match->reference_text;
        }

        if ($match->min_value !== null && $match->max_value !== null) {
            return $this->formatDisplayNumber($match->min_value).' - '.$this->formatDisplayNumber($match->max_value);
        }

        if ($match->max_value !== null) {
            return 'Menor a '.$this->formatDisplayNumber($match->max_value);
        }

        if ($match->min_value !== null) {
            return 'Mayor a '.$this->formatDisplayNumber($match->min_value);
        }

        return '';
    }

    private function formatResultValue(?string $value, ?string $parameterType): string
    {
        if ($value === null || $value === '') {
            return '—';
        }

        if (in_array($parameterType, ['numeric', 'calculated'], true) && is_numeric($value)) {
            return $this->formatDisplayNumber((float) $value);
        }

        return $value;
    }

    private function formatDisplayNumber(int|float|string $value): string
    {
        $numeric = (float) $value;
        $formatted = number_format($numeric, 2, ',', '.');
        $formatted = preg_replace('/,00$/', '', $formatted) ?? $formatted;
        $formatted = preg_replace('/(\,\d*[1-9])0+$/', '$1', $formatted) ?? $formatted;

        return $formatted;
    }
}
