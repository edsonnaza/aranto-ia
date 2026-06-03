<?php

namespace Database\Seeders;

use App\Models\Laboratory\LabTestProfile;
use App\Models\Laboratory\LabTestParameter;
use App\Models\Laboratory\LabProfileEquipment;
use App\Models\Laboratory\LabEquipment;
use App\Models\Laboratory\LabReferenceRange;
use App\Models\MedicalService;
use Illuminate\Database\Seeder;

class LabTestProfileSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            [
                'service_code' => 'LAB-HEM-001',
                'profile_name' => 'Hemograma Completo',
                'equipment' => ['HEMA-AUTO-01'],
                'parameters' => [
                    ['name' => 'Hemoglobina', 'code' => 'HGB', 'type' => 'numeric', 'unit' => 'g/dL'],
                    ['name' => 'Hematocrito', 'code' => 'HCT', 'type' => 'numeric', 'unit' => '%'],
                    ['name' => 'Glóbulos Rojos', 'code' => 'RBC', 'type' => 'numeric', 'unit' => 'M/µL'],
                    ['name' => 'Glóbulos Blancos', 'code' => 'WBC', 'type' => 'numeric', 'unit' => 'K/µL'],
                    ['name' => 'Plaquetas', 'code' => 'PLT', 'type' => 'numeric', 'unit' => 'K/µL'],
                    ['name' => 'VCM', 'code' => 'MCV', 'type' => 'numeric', 'unit' => 'fL'],
                    ['name' => 'HCM', 'code' => 'MCH', 'type' => 'numeric', 'unit' => 'pg'],
                    ['name' => 'CHCM', 'code' => 'MCHC', 'type' => 'numeric', 'unit' => 'g/dL'],
                ],
            ],
            [
                'service_code' => 'LAB-GLU-001',
                'profile_name' => 'Glucemia',
                'equipment' => ['CHEM-AUTO-01'],
                'parameters' => [
                    ['name' => 'Glucosa', 'code' => 'GLU', 'type' => 'numeric', 'unit' => 'mg/dL'],
                ],
            ],
            [
                'service_code' => 'LAB-COL-001',
                'profile_name' => 'Perfil Lipídico',
                'equipment' => ['CHEM-AUTO-01'],
                'parameters' => [
                    ['name' => 'Colesterol Total', 'code' => 'CHOL', 'type' => 'numeric', 'unit' => 'mg/dL'],
                    ['name' => 'Triglicéridos', 'code' => 'TRIG', 'type' => 'numeric', 'unit' => 'mg/dL'],
                    ['name' => 'HDL', 'code' => 'HDL', 'type' => 'numeric', 'unit' => 'mg/dL'],
                    ['name' => 'LDL', 'code' => 'LDL', 'type' => 'numeric', 'unit' => 'mg/dL'],
                ],
            ],
            [
                'service_code' => 'LAB-COA-003',
                'profile_name' => 'Coagulograma',
                'equipment' => ['COAG-AUTO-01'],
                'parameters' => [
                    ['name' => 'Tiempo de Protrombina (TP)', 'code' => 'PT', 'type' => 'numeric', 'unit' => 'seg'],
                    ['name' => 'INR', 'code' => 'INR', 'type' => 'numeric', 'unit' => 'ratio'],
                    ['name' => 'TTPA', 'code' => 'aPTT', 'type' => 'numeric', 'unit' => 'seg'],
                    ['name' => 'Fibrinógeno', 'code' => 'FRIB', 'type' => 'numeric', 'unit' => 'mg/dL'],
                ],
            ],
            [
                'service_code' => 'LAB-ORI-001',
                'profile_name' => 'Orina Completa',
                'equipment' => ['URIN-AUTO-01', 'MICRO-DIG-01'],
                'parameters' => [
                    ['name' => 'Densidad Relativa', 'code' => 'SG', 'type' => 'numeric', 'unit' => ''],
                    ['name' => 'pH', 'code' => 'PH', 'type' => 'numeric', 'unit' => ''],
                    ['name' => 'Proteínas', 'code' => 'PROT', 'type' => 'text', 'unit' => ''],
                    ['name' => 'Glucosa', 'code' => 'GLU_URIN', 'type' => 'text', 'unit' => ''],
                    ['name' => 'Cetonas', 'code' => 'KET', 'type' => 'text', 'unit' => ''],
                    ['name' => 'Sangre', 'code' => 'BLD', 'type' => 'text', 'unit' => ''],
                    ['name' => 'Leucocitos', 'code' => 'LEU', 'type' => 'numeric', 'unit' => 'x/µL'],
                    ['name' => 'Glóbulos Rojos', 'code' => 'RBC_URIN', 'type' => 'numeric', 'unit' => 'x/µL'],
                    ['name' => 'Bacterias', 'code' => 'BACT', 'type' => 'text', 'unit' => ''],
                    ['name' => 'Cristales', 'code' => 'CRYS', 'type' => 'text', 'unit' => ''],
                ],
            ],
            [
                'service_code' => 'LAB-HEP-001',
                'profile_name' => 'Hepatograma',
                'equipment' => ['CHEM-AUTO-01'],
                'parameters' => [
                    ['name' => 'TGO (AST)', 'code' => 'AST', 'type' => 'numeric', 'unit' => 'U/L'],
                    ['name' => 'TGP (ALT)', 'code' => 'ALT', 'type' => 'numeric', 'unit' => 'U/L'],
                    ['name' => 'FAL', 'code' => 'ALP', 'type' => 'numeric', 'unit' => 'U/L'],
                    ['name' => 'GGT', 'code' => 'GGT', 'type' => 'numeric', 'unit' => 'U/L'],
                    ['name' => 'Bilirrubina Total', 'code' => 'BILI_T', 'type' => 'numeric', 'unit' => 'mg/dL'],
                    ['name' => 'Bilirrubina Directa', 'code' => 'BILI_D', 'type' => 'numeric', 'unit' => 'mg/dL'],
                ],
            ],
            [
                'service_code' => 'LAB-CRE-001',
                'profile_name' => 'Función Renal',
                'equipment' => ['CHEM-AUTO-01'],
                'parameters' => [
                    ['name' => 'Creatinina', 'code' => 'CREA', 'type' => 'numeric', 'unit' => 'mg/dL'],
                    ['name' => 'Nitrógeno Ureico', 'code' => 'BUN', 'type' => 'numeric', 'unit' => 'mg/dL'],
                    ['name' => 'Sodio', 'code' => 'NA', 'type' => 'numeric', 'unit' => 'mEq/L'],
                    ['name' => 'Potasio', 'code' => 'K', 'type' => 'numeric', 'unit' => 'mEq/L'],
                    ['name' => 'Cloro', 'code' => 'CL', 'type' => 'numeric', 'unit' => 'mEq/L'],
                ],
            ],
        ];

        foreach ($profiles as $profileData) {
            $service = MedicalService::where('code', $profileData['service_code'])->first();
            
            if (!$service) {
                echo "⚠️ Servicio {$profileData['service_code']} no encontrado\n";
                continue;
            }

            $profile = LabTestProfile::create([
                'medical_service_id' => $service->id,
                'name' => $profileData['profile_name'],
                'code' => strtoupper(str_replace(' ', '_', $profileData['profile_name'])),
                'status' => 'active',
            ]);

            foreach ($profileData['parameters'] as $index => $paramData) {
                LabTestParameter::create([
                    'lab_test_profile_id' => $profile->id,
                    'name' => $paramData['name'],
                    'code' => $paramData['code'],
                    'parameter_type' => $paramData['type'],
                    'unit' => $paramData['unit'],
                    'display_order' => $index + 1,
                    'is_required' => true,
                ]);
            }

            foreach ($profileData['equipment'] as $equipmentCode) {
                $equipment = LabEquipment::where('code', $equipmentCode)->first();
                if ($equipment) {
                    LabProfileEquipment::create([
                        'lab_test_profile_id' => $profile->id,
                        'lab_equipment_id' => $equipment->id,
                        'is_default' => $equipmentCode === $profileData['equipment'][0],
                    ]);
                }
            }

            echo "✅ Perfil '{$profileData['profile_name']}' creado\n";
        }
    }
}
