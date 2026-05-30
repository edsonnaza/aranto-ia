<?php
namespace App\Http\Requests\Laboratory;

use Illuminate\Foundation\Http\FormRequest;

class StoreLabResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lab_sample_id' => 'required|exists:lab_samples,id',
            'lab_test_parameter_id' => 'required|exists:lab_test_parameters,id',
            'equipment_id' => 'nullable|exists:lab_equipments,id',
            'value' => 'nullable|string|max:255',
            'calculated_percentage' => 'nullable|numeric',
            'is_out_of_range' => 'boolean',
            'status' => 'required|in:draft,validated',
            'entered_by' => 'required|exists:users,id',
        ];
    }
}