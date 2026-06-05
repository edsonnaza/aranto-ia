<?php
namespace App\Http\Requests\Laboratory;

use Illuminate\Foundation\Http\FormRequest;

class StoreLabValidationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lab_sample_id' => 'required|exists:lab_samples,id',
            'validated_by' => 'required|exists:users,id',
            'validated_at' => 'required|date',
            'comments' => 'nullable|string',
        ];
    }
}