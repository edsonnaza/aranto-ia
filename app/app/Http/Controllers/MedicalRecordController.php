<?php

namespace App\Http\Controllers;

use App\Models\MedicalRecord;
use App\Models\MedicalPrescription;
use App\Models\MedicalRecordFile;
use App\Models\Patient;
use App\Models\User;
use App\Http\Requests\StoreMedicalRecordRequest;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;

class MedicalRecordController extends Controller
{
    public function create(Patient $patient)
    {
        $doctors = User::select('id', 'name')->limit(200)->get();

        return Inertia::render('medical/medical-records/Create', [
            'patient' => $patient,
            'doctors' => $doctors,
        ]);
    }

    public function store(StoreMedicalRecordRequest $request, Patient $patient): RedirectResponse
    {
        $data = $request->validated();

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

            return redirect()->route('medical.patients.show', $patient->id)->with('success', 'Historia clínica guardada correctamente.');
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);
            return redirect()->back()->withErrors('No se pudo guardar la historia clínica.');
        }
    }

    public function show(MedicalRecord $medicalRecord)
    {
        $medicalRecord->load('prescriptions', 'files', 'patient', 'doctor');

        return Inertia::render('medical/medical-records/Show', [
            'medicalRecord' => $medicalRecord,
        ]);
    }

    public function downloadFile(MedicalRecordFile $file)
    {
        if (!Storage::disk('public')->exists($file->file_path)) {
            abort(404);
        }

        return Storage::disk('public')->download($file->file_path, $file->original_name ?: null);
    }
}
