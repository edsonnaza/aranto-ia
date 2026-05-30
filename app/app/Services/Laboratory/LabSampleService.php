<?php
namespace App\Services\Laboratory;

use App\DTOs\Laboratory\LabSampleDTO;
use App\Models\Laboratory\LabSample;

class LabSampleService
{
    public function store(LabSampleDTO $dto): LabSample
    {
        return LabSample::create((array) $dto);
    }
    public function update(LabSample $sample, LabSampleDTO $dto): LabSample
    {
        $sample->update((array) $dto);
        return $sample;
    }
}