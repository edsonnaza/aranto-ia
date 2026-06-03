<?php

namespace Database\Seeders;

use App\Models\Laboratory\LabTestParameter;
use App\Models\Laboratory\LabReferenceRange;
use Illuminate\Database\Seeder;

class LabReferenceRangeSeeder extends Seeder
{
    public function run(): void
    {
        $ranges = [
            'HGB' => [
                ['gender' => 'M', 'min_value' => '13.5', 'max_value' => '17.5', 'unit' => 'g/dL'],
                ['gender' => 'F', 'min_value' => '12.0', 'max_value' => '15.5', 'unit' => 'g/dL'],
            ],
            'HCT' => [
                ['gender' => 'M', 'min_value' => '41', 'max_value' => '50', 'unit' => '%'],
                ['gender' => 'F', 'min_value' => '36', 'max_value' => '44', 'unit' => '%'],
            ],
            'RBC' => [
                ['gender' => 'M', 'min_value' => '4.7', 'max_value' => '6.1', 'unit' => 'M/µL'],
                ['gender' => 'F', 'min_value' => '4.2', 'max_value' => '5.4', 'unit' => 'M/µL'],
            ],
            'WBC' => [['min_value' => '4.5', 'max_value' => '11.0', 'unit' => 'K/µL']],
            'PLT' => [['min_value' => '150', 'max_value' => '400', 'unit' => 'K/µL']],
            'MCV' => [['min_value' => '80', 'max_value' => '100', 'unit' => 'fL']],
            'MCH' => [['min_value' => '27', 'max_value' => '33', 'unit' => 'pg']],
            'MCHC' => [['min_value' => '32', 'max_value' => '36', 'unit' => 'g/dL']],
            'GLU' => [['min_value' => '70', 'max_value' => '100', 'unit' => 'mg/dL', 'reference_text' => 'Ayuno']],
            'CHOL' => [['min_value' => '0', 'max_value' => '200', 'unit' => 'mg/dL', 'reference_text' => 'Deseable']],
            'TRIG' => [['min_value' => '0', 'max_value' => '150', 'unit' => 'mg/dL']],
            'HDL' => [['min_value' => '40', 'max_value' => '999', 'unit' => 'mg/dL']],
            'LDL' => [['min_value' => '0', 'max_value' => '100', 'unit' => 'mg/dL', 'reference_text' => 'Óptimo']],
            'PT' => [['min_value' => '11.5', 'max_value' => '13.5', 'unit' => 'seg']],
            'INR' => [['min_value' => '0.8', 'max_value' => '1.1', 'unit' => 'ratio']],
            'aPTT' => [['min_value' => '22', 'max_value' => '35', 'unit' => 'seg']],
            'FRIB' => [['min_value' => '200', 'max_value' => '400', 'unit' => 'mg/dL']],
            'AST' => [['min_value' => '10', 'max_value' => '40', 'unit' => 'U/L']],
            'ALT' => [['min_value' => '7', 'max_value' => '56', 'unit' => 'U/L']],
            'ALP' => [['min_value' => '30', 'max_value' => '120', 'unit' => 'U/L']],
            'GGT' => [['min_value' => '9', 'max_value' => '48', 'unit' => 'U/L']],
            'BILI_T' => [['min_value' => '0.1', 'max_value' => '1.2', 'unit' => 'mg/dL']],
            'BILI_D' => [['min_value' => '0.0', 'max_value' => '0.3', 'unit' => 'mg/dL']],
            'CREA' => [
                ['gender' => 'M', 'min_value' => '0.7', 'max_value' => '1.3', 'unit' => 'mg/dL'],
                ['gender' => 'F', 'min_value' => '0.6', 'max_value' => '1.1', 'unit' => 'mg/dL'],
            ],
            'BUN' => [['min_value' => '7', 'max_value' => '20', 'unit' => 'mg/dL']],
            'NA' => [['min_value' => '136', 'max_value' => '145', 'unit' => 'mEq/L']],
            'K' => [['min_value' => '3.5', 'max_value' => '5.0', 'unit' => 'mEq/L']],
            'CL' => [['min_value' => '98', 'max_value' => '107', 'unit' => 'mEq/L']],
        ];

        foreach ($ranges as $paramCode => $rangeList) {
            $parameter = LabTestParameter::where('code', $paramCode)->first();
            
            if (!$parameter) {
                echo "⚠️ Parámetro {$paramCode} no encontrado\n";
                continue;
            }

            foreach ($rangeList as $rangeData) {
                $gender = $rangeData['gender'] ?? 'all';
                if ($gender === 'M') {
                    $gender = 'male';
                } elseif ($gender === 'F') {
                    $gender = 'female';
                }

                LabReferenceRange::create([
                    'lab_test_parameter_id' => $parameter->id,
                    'gender' => $gender,
                    'age_min' => $rangeData['age_min'] ?? null,
                    'age_max' => $rangeData['age_max'] ?? null,
                    'min_value' => $rangeData['min_value'] ?? null,
                    'max_value' => $rangeData['max_value'] ?? null,
                    'reference_text' => $rangeData['reference_text'] ?? null,
                ]);
            }

            echo "✅ Rangos para {$paramCode} creados\n";
        }
    }
}
