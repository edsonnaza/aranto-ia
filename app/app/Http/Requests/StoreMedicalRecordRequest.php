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
            'reason' => 'required|string|max:255',
            'vitals' => 'nullable|array',
            'vitals.bp' => 'nullable|string|max:20',
            'vitals.temp' => 'nullable|string|max:20',
            'vitals.pulse' => 'nullable|string|max:20',
            'vitals.spO2' => 'nullable|string|max:20',
            'symptoms' => 'nullable|string|max:5000',
            'diagnosis' => 'nullable|string|max:5000',
            'treatment' => 'nullable|string|max:5000',
            'prescriptions' => 'nullable|array',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:51200',
        ];
    }
}
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
