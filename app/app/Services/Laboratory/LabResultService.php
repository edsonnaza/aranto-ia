<?php
namespace App\Services\Laboratory;

use App\DTOs\Laboratory\LabResultDTO;
use App\Models\Laboratory\LabResult;

class LabResultService
{
    public function store(LabResultDTO $dto): LabResult
    {
        return LabResult::create((array) $dto);
    }
    public function update(LabResult $result, LabResultDTO $dto): LabResult
    {
        $result->update((array) $dto);
        return $result;
    }
}