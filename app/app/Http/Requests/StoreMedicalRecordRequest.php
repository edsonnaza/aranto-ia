<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMedicalRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'consultation_date' => ['required', 'date'],
            'reason' => ['nullable', 'string', 'max:255'],
            'symptoms' => ['nullable', 'string'],
            'diagnosis' => ['nullable', 'string'],
            'treatment' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'vital_signs' => ['nullable', 'array'],

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
