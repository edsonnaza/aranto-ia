<?php
namespace App\Http\Requests\Laboratory;

use Illuminate\Foundation\Http\FormRequest;

class StoreLabSampleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Policy se aplica en el controlador
    }

    public function rules(): array
    {
        return [
            'service_request_detail_id' => 'required|exists:service_request_details,id',
            'sample_number' => 'required|string|max:50',
            'sample_type' => 'nullable|string|max:100',
            'collected_at' => 'nullable|date',
            'received_at' => 'nullable|date',
            'received_by' => 'nullable|exists:users,id',
            'status' => 'required|in:pending,received,processing,completed,rejected',
            'remarks' => 'nullable|string',
        ];
    }
}