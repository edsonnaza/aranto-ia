<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMedicalRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->can('create', \App\Models\MedicalRecord::class);
    }

    public function rules(): array
    {
        return [
            'consultation_date' => ['required', 'date'],
            'reason' => ['required', 'string', 'max:255'],
            'symptoms' => ['nullable', 'string'],
            'diagnosis' => ['nullable', 'string'],
            'treatment' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],

            // Snapshot JSON
            'vital_signs' => ['nullable', 'array'],
            'vital_signs.temperature' => ['nullable', 'numeric'],
            'vital_signs.pulse' => ['nullable', 'integer'],
            'vital_signs.spo2' => ['nullable', 'integer'],
            'vital_signs.respiratory_rate' => ['nullable', 'integer'],
            'vital_signs.bp_systolic' => ['nullable', 'integer'],
            'vital_signs.bp_diastolic' => ['nullable', 'integer'],
            'vital_signs.blood_pressure' => ['nullable', 'string', 'max:16'],

            'prescriptions' => ['nullable', 'array'],
            'prescriptions.*.medication_name' => ['required_with:prescriptions', 'string', 'max:255'],
            'prescriptions.*.dosage' => ['nullable', 'string', 'max:255'],
            'prescriptions.*.frequency' => ['nullable', 'string', 'max:255'],
            'prescriptions.*.duration' => ['nullable', 'string', 'max:255'],
            'prescriptions.*.notes' => ['nullable', 'string'],

            'files' => ['nullable', 'array'],
            'files.*' => ['file', 'max:5120', 'mimes:pdf,jpg,jpeg,png,doc,docx'],
        ];
    }
}
