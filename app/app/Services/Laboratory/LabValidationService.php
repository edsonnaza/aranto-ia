<?php
namespace App\Services\Laboratory;

use App\DTOs\Laboratory\LabValidationDTO;
use App\Models\Laboratory\LabValidation;

class LabValidationService
{
    public function store(LabValidationDTO $dto): LabValidation
    {
        return LabValidation::create((array) $dto);
    }
    public function update(LabValidation $validation, LabValidationDTO $dto): LabValidation
    {
        $validation->update((array) $dto);
        return $validation;
    }
}