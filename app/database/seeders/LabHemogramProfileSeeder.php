<?php

namespace Database\Seeders;

use App\Models\Laboratory\LabArea;
use App\Models\Laboratory\LabEquipment;
use App\Models\Laboratory\LabProfileEquipment;
use App\Models\Laboratory\LabReferenceRange;
use App\Models\Laboratory\LabTestParameter;
use App\Models\Laboratory\LabTestProfile;
use App\Models\MedicalService;
use Illuminate\Database\Seeder;

class LabHemogramProfileSeeder extends Seeder
{
    public function run(): void
    {
        $service = MedicalService::query()->where('code', 'LAB-HEM-001')->first();

        if (! $service) {
            $this->command?->warn('LabHemogramProfileSeeder: no se encontro el servicio LAB-HEM-001.');
            return;
        }

        $areaId = LabArea::query()->where('code', 'HEMA')->value('id');

        $profile = LabTestProfile::query()->updateOrCreate(
            ['medical_service_id' => $service->id],
            [
                'lab_area_id' => $areaId,
                'name' => 'Hemograma Completo',
                'code' => 'HEMOGRAMA_COMPLETO',
                'description' => 'Perfil base de hemograma completo con indices eritrocitarios y formula leucocitaria.',
                'status' => 'active',
                'validation_type' => 'sum_100',
                'validation_target' => 100,
                'validation_tolerance' => 2,
            ],
        );

        $parameterDefinitions = [
            [
                'name' => 'Hemoglobina',
                'code' => 'HGB',
                'parameter_type' => 'numeric',
                'unit' => 'g/dL',
                'include_in_sum_100' => false,
                'reference_ranges' => [
                    ['gender' => 'male', 'min_value' => 13.5, 'max_value' => 17.5],
                    ['gender' => 'female', 'min_value' => 12.0, 'max_value' => 15.5],
                ],
            ],
            [
                'name' => 'Hematocrito',
                'code' => 'HCT',
                'parameter_type' => 'numeric',
                'unit' => '%',
                'include_in_sum_100' => false,
                'reference_ranges' => [
                    ['gender' => 'male', 'min_value' => 41, 'max_value' => 50],
                    ['gender' => 'female', 'min_value' => 36, 'max_value' => 44],
                ],
            ],
            [
                'name' => 'Glóbulos Rojos',
                'code' => 'RBC',
                'parameter_type' => 'numeric',
                'unit' => 'M/µL',
                'include_in_sum_100' => false,
                'reference_ranges' => [
                    ['gender' => 'male', 'min_value' => 4.7, 'max_value' => 6.1],
                    ['gender' => 'female', 'min_value' => 4.2, 'max_value' => 5.4],
                ],
            ],
            [
                'name' => 'Glóbulos Blancos',
                'code' => 'WBC',
                'parameter_type' => 'numeric',
                'unit' => 'K/µL',
                'include_in_sum_100' => false,
                'reference_ranges' => [
                    ['gender' => 'all', 'min_value' => 4.5, 'max_value' => 11.0],
                ],
            ],
            [
                'name' => 'Plaquetas',
                'code' => 'PLT',
                'parameter_type' => 'numeric',
                'unit' => 'K/µL',
                'include_in_sum_100' => false,
                'reference_ranges' => [
                    ['gender' => 'all', 'min_value' => 150000, 'max_value' => 400000],
                ],
            ],
            [
                'name' => 'VCM',
                'code' => 'MCV',
                'parameter_type' => 'numeric',
                'unit' => 'fL',
                'include_in_sum_100' => false,
                'reference_ranges' => [
                    ['gender' => 'all', 'min_value' => 80, 'max_value' => 100],
                ],
            ],
            [
                'name' => 'HCM',
                'code' => 'MCH',
                'parameter_type' => 'numeric',
                'unit' => 'pg',
                'include_in_sum_100' => false,
                'reference_ranges' => [
                    ['gender' => 'all', 'min_value' => 27, 'max_value' => 33],
                ],
            ],
            [
                'name' => 'CHCM',
                'code' => 'MCHC',
                'parameter_type' => 'numeric',
                'unit' => 'g/dL',
                'include_in_sum_100' => false,
                'reference_ranges' => [
                    ['gender' => 'all', 'min_value' => 32, 'max_value' => 36],
                ],
            ],
            [
                'name' => 'Neutrófilos',
                'code' => 'NEUT_PCT',
                'parameter_type' => 'numeric',
                'unit' => '%',
                'include_in_sum_100' => true,
                'reference_ranges' => [
                    ['gender' => 'all', 'age_min' => 5, 'age_max' => 90, 'min_value' => 40, 'max_value' => 70],
                ],
            ],
            [
                'name' => 'Linfocitos',
                'code' => 'LYMPH_PCT',
                'parameter_type' => 'numeric',
                'unit' => '%',
                'include_in_sum_100' => true,
                'reference_ranges' => [
                    ['gender' => 'all', 'min_value' => 20, 'max_value' => 40],
                ],
            ],
            [
                'name' => 'Monocitos',
                'code' => 'MONO_PCT',
                'parameter_type' => 'numeric',
                'unit' => '%',
                'include_in_sum_100' => true,
                'reference_ranges' => [
                    ['gender' => 'all', 'min_value' => 2, 'max_value' => 8],
                ],
            ],
            [
                'name' => 'Eosinófilos',
                'code' => 'EOS_PCT',
                'parameter_type' => 'numeric',
                'unit' => '%',
                'include_in_sum_100' => true,
                'reference_ranges' => [
                    ['gender' => 'all', 'min_value' => 1, 'max_value' => 4],
                ],
            ],
            [
                'name' => 'Basófilos',
                'code' => 'BASO_PCT',
                'parameter_type' => 'numeric',
                'unit' => '%',
                'include_in_sum_100' => true,
                'reference_ranges' => [
                    ['gender' => 'all', 'min_value' => 0, 'max_value' => 1],
                ],
            ],
        ];

        foreach ($parameterDefinitions as $index => $definition) {
            $parameter = LabTestParameter::query()->updateOrCreate(
                [
                    'lab_test_profile_id' => $profile->id,
                    'code' => $definition['code'],
                ],
                [
                    'name' => $definition['name'],
                    'parameter_type' => $definition['parameter_type'],
                    'unit' => $definition['unit'],
                    'display_order' => $index + 1,
                    'is_required' => true,
                    'status' => 'active',
                    'include_in_sum_100' => $definition['include_in_sum_100'],
                    'formula' => null,
                ],
            );

            foreach ($definition['reference_ranges'] as $rangeDefinition) {
                LabReferenceRange::query()->updateOrCreate(
                    [
                        'lab_test_parameter_id' => $parameter->id,
                        'gender' => $rangeDefinition['gender'],
                        'age_min' => $rangeDefinition['age_min'] ?? null,
                        'age_max' => $rangeDefinition['age_max'] ?? null,
                    ],
                    [
                        'min_value' => $rangeDefinition['min_value'] ?? null,
                        'max_value' => $rangeDefinition['max_value'] ?? null,
                        'reference_text' => $rangeDefinition['reference_text'] ?? null,
                    ],
                );
            }
        }

        $equipment = LabEquipment::query()->where('code', 'HEMA-AUTO-01')->first();

        if ($equipment) {
            LabProfileEquipment::query()->updateOrCreate(
                [
                    'lab_test_profile_id' => $profile->id,
                    'lab_equipment_id' => $equipment->id,
                ],
                ['is_default' => true],
            );
        }

        $this->command?->info('LabHemogramProfileSeeder ejecutado: Hemograma Completo actualizado.');
    }
}
