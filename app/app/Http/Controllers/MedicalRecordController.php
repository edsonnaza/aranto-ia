<?php

namespace App\Http\Controllers;

use App\Events\PatientFinished;
use App\Models\ConsultationQueue;
use App\Models\MedicalRecord;
use App\Models\MedicalRecordFile;
use App\Models\Patient;
use App\Models\User;
use App\Http\Requests\StoreMedicalRecordRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;
use App\Traits\HandlesVitalSigns;

class MedicalRecordController extends Controller
{
    use HandlesVitalSigns;
    public function create(Patient $patient)
    {
        $this->authorize('create', MedicalRecord::class);

        $user = auth()->user();
        $isDoctor = $user && method_exists($user, 'hasRole') && $user->hasRole('doctor');

        // If the current user is a doctor, do not expose the doctors dropdown.
        $fromQueue = session('from_queue', false);

        if ($isDoctor) {
            $currentDoctor = [
                'id' => $user->id,
                'name' => $user->name,
            ];

            return Inertia::render('medical/medical-records/Create', [
                'patient' => $patient,
                'currentDoctor' => $currentDoctor,
                'fromQueue' => $fromQueue,
            ]);
        }

        $doctors = User::select('id', 'name')->limit(200)->get();

        return Inertia::render('medical/medical-records/Create', [
            'patient' => $patient,
            'doctors' => $doctors,
            'fromQueue' => $fromQueue,
        ]);
    }

    public function store(StoreMedicalRecordRequest $request, Patient $patient): RedirectResponse
    {
        $data = $request->validated();
        // Security: only a logged doctor may create a clinical record from the consultorio flow.
        $user = auth()->user();
        if (!$user || !method_exists($user, 'hasRole') || !$user->hasRole('doctor')) {
            abort(403, 'Solo usuarios con rol de médico pueden crear historias clínicas desde el consultorio.');
        }

        // Force doctor_id to be the authenticated user — ignore any client-supplied doctor_id
        $data['doctor_id'] = $user->id;

        DB::beginTransaction();
        try {
            $data['patient_id'] = $patient->id;
            $data['created_by'] = auth()->id();

            $medicalRecord = MedicalRecord::create($data);

            if (!empty($data['prescriptions']) && is_array($data['prescriptions'])) {
                foreach ($data['prescriptions'] as $presc) {
                    $medicalRecord->prescriptions()->create(array_merge($presc, ['created_by' => auth()->id()]));
                }
            }

            // Persist vital signs snapshot into `vital_signs` table for time-series tracking
            if (!empty($data['vital_signs']) && is_array($data['vital_signs'])) {
                try {
                    $this->persistVitalSignSnapshot($medicalRecord, $data['vital_signs']);
                } catch (\Throwable $e) {
                    // non-fatal: report and continue
                    report($e);
                }
            }

            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $path = $file->store('medical_records', 'public');
                    $medicalRecord->files()->create([
                        'file_path' => $path,
                        'file_type' => $file->getClientMimeType(),
                        'original_name' => $file->getClientOriginalName(),
                        'uploaded_by' => auth()->id(),
                    ]);
                }
            }

            DB::commit();

            // If this medical record was created from the consultorio flow, mark the related queue entry as finished
            try {
                $queueEntry = ConsultationQueue::where('patient_id', $patient->id)
                    ->where('doctor_id', $user->id)
                    ->whereIn('status', ['in_consultation', 'called'])
                    ->latest('created_at')
                    ->first();

                if ($queueEntry) {
                    $queueEntry->update(['status' => 'done', 'finished_at' => now()]);
                    event(new PatientFinished($queueEntry));
                }
            } catch (\Throwable $e) {
                report($e);
            }

            return redirect()->route('medical.patients.show', $patient->id)->with('success', 'Historia clínica guardada correctamente.');
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);
            return redirect()->back()->withErrors('No se pudo guardar la historia clínica.');
        }
    }

    public function show(MedicalRecord $medicalRecord)
    {
        $this->authorize('view', $medicalRecord);

        $medicalRecord->load('prescriptions', 'files', 'patient', 'doctor', 'amendments.createdBy');

        return Inertia::render('medical/medical-records/Show', [
            'medicalRecord' => $medicalRecord,
        ]);
    }

    /**
     * Store an amendment (append-only) for a medical record.
     */
    public function storeAmendment(Request $request, MedicalRecord $medicalRecord): RedirectResponse
    {
        $this->authorize('update', $medicalRecord);

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
        ]);

        try {
            $medicalRecord->amendments()->create([
                'content' => $validated['content'],
                'created_by' => auth()->id(),
            ]);

            return redirect()->route('medical.medical-records.show', $medicalRecord->id)->with('success', 'Enmienda registrada.');
        } catch (\Throwable $e) {
            report($e);
            return redirect()->back()->withErrors('No se pudo guardar la enmienda.');
        }
    }

    public function downloadFile(MedicalRecordFile $file)
    {
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');
        if (!$disk->exists($file->file_path)) {
            abort(404);
        }

        return $disk->download($file->file_path, $file->original_name ?: null);
    }
}
