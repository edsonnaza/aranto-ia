<?php

namespace Database\Seeders;

use App\Models\Laboratory\LabEquipment;
use App\Models\Laboratory\LabProfileEquipment;
use App\Models\Laboratory\LabTestParameter;
use App\Models\Laboratory\LabTestProfile;
use App\Models\MedicalService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LabProfilesCoverageSeeder extends Seeder
{
    public function run(): void
    {
        $labServices = MedicalService::query()
            ->where('status', 'active')
            ->where('code', 'like', 'LAB-%')
            ->get();

        $created = 0;

        foreach ($labServices as $service) {
            $profile = LabTestProfile::query()->firstOrCreate(
                ['medical_service_id' => $service->id],
                [
                    'name' => $service->name,
                    'code' => $this->buildProfileCode($service->name),
                    'description' => 'Perfil autogenerado para cobertura de configuración inicial.',
                    'status' => 'active',
                ]
            );

            if ($profile->wasRecentlyCreated) {
                $created++;
            }

            $this->syncProfileParameters($profile, $service->name);
            $this->syncProfileEquipment($profile, $service->name);
        }

        $this->command->info("LabProfilesCoverageSeeder ejecutado. Perfiles nuevos: {$created}");
    }

    private function syncProfileParameters(LabTestProfile $profile, string $serviceName): void
    {
        $existingCodes = $profile->parameters()->pluck('code')->all();
        $parameterTemplates = $this->parameterTemplates($serviceName);

        foreach ($parameterTemplates as $index => $template) {
            if (in_array($template['code'], $existingCodes, true)) {
                continue;
            }

            LabTestParameter::query()->create([
                'lab_test_profile_id' => $profile->id,
                'name' => $template['name'],
                'code' => $template['code'],
                'parameter_type' => $template['parameter_type'],
                'unit' => $template['unit'],
                'display_order' => $profile->parameters()->count() + $index + 1,
                'is_required' => true,
            ]);
        }
    }

    private function syncProfileEquipment(LabTestProfile $profile, string $serviceName): void
    {
        $equipmentCode = $this->equipmentCodeForService($serviceName);
        if (!$equipmentCode) {
            return;
        }

        $equipment = LabEquipment::query()->where('code', $equipmentCode)->first();
        if (!$equipment) {
            return;
        }

        $alreadyLinked = $profile->profileEquipments()->where('lab_equipment_id', $equipment->id)->exists();
        if ($alreadyLinked) {
            return;
        }

        $hasDefault = $profile->profileEquipments()->where('is_default', true)->exists();

        LabProfileEquipment::query()->create([
            'lab_test_profile_id' => $profile->id,
            'lab_equipment_id' => $equipment->id,
            'is_default' => !$hasDefault,
        ]);
    }

    private function buildProfileCode(string $serviceName): string
    {
        $normalized = Str::upper(Str::ascii($serviceName));
        $normalized = preg_replace('/[^A-Z0-9]+/', '_', $normalized) ?? 'PROFILE';
        $normalized = trim($normalized, '_');

        return Str::limit($normalized, 50, '');
    }

    private function equipmentCodeForService(string $serviceName): ?string
    {
        $name = Str::lower($serviceName);

        if (str_contains($name, 'orina') || str_contains($name, 'uro')) {
            return 'URIN-AUTO-01';
        }

        if (str_contains($name, 'coagul') || str_contains($name, 'inr') || str_contains($name, 'tppa')) {
            return 'COAG-AUTO-01';
        }

        if (str_contains($name, 'hemograma') || str_contains($name, 'hemat') || str_contains($name, 'cbc')) {
            return 'HEMA-AUTO-01';
        }

        return 'CHEM-AUTO-01';
    }

    private function parameterTemplates(string $serviceName): array
    {
        $name = Str::lower($serviceName);

        if (str_contains($name, 'hemograma') || str_contains($name, 'hemat') || str_contains($name, 'cbc')) {
            return [
                ['name' => 'Hemoglobina', 'code' => 'HGB', 'parameter_type' => 'numeric', 'unit' => 'g/dL'],
                ['name' => 'Hematocrito', 'code' => 'HCT', 'parameter_type' => 'numeric', 'unit' => '%'],
                ['name' => 'Leucocitos', 'code' => 'WBC', 'parameter_type' => 'numeric', 'unit' => 'K/uL'],
                ['name' => 'Plaquetas', 'code' => 'PLT', 'parameter_type' => 'numeric', 'unit' => 'K/uL'],
            ];
        }

        if (str_contains($name, 'orina') || str_contains($name, 'uro')) {
            return [
                ['name' => 'pH', 'code' => 'PH', 'parameter_type' => 'numeric', 'unit' => ''],
                ['name' => 'Densidad', 'code' => 'SG', 'parameter_type' => 'numeric', 'unit' => ''],
                ['name' => 'Proteinas', 'code' => 'PROT', 'parameter_type' => 'text', 'unit' => ''],
                ['name' => 'Glucosa', 'code' => 'GLU_URIN', 'parameter_type' => 'text', 'unit' => ''],
            ];
        }

        if (str_contains($name, 'coagul') || str_contains($name, 'inr') || str_contains($name, 'tppa')) {
            return [
                ['name' => 'TP', 'code' => 'PT', 'parameter_type' => 'numeric', 'unit' => 'seg'],
                ['name' => 'INR', 'code' => 'INR', 'parameter_type' => 'numeric', 'unit' => 'ratio'],
                ['name' => 'TTPA', 'code' => 'APTT', 'parameter_type' => 'numeric', 'unit' => 'seg'],
            ];
        }

        if (str_contains($name, 'hepat') || str_contains($name, 'transamina') || str_contains($name, 'bilirr')) {
            return [
                ['name' => 'AST', 'code' => 'AST', 'parameter_type' => 'numeric', 'unit' => 'U/L'],
                ['name' => 'ALT', 'code' => 'ALT', 'parameter_type' => 'numeric', 'unit' => 'U/L'],
                ['name' => 'Bilirrubina Total', 'code' => 'BILI_T', 'parameter_type' => 'numeric', 'unit' => 'mg/dL'],
            ];
        }

        if (str_contains($name, 'renal') || str_contains($name, 'creatin') || str_contains($name, 'urea')) {
            return [
                ['name' => 'Creatinina', 'code' => 'CREA', 'parameter_type' => 'numeric', 'unit' => 'mg/dL'],
                ['name' => 'Urea', 'code' => 'UREA', 'parameter_type' => 'numeric', 'unit' => 'mg/dL'],
            ];
        }

        if (str_contains($name, 'gluc')) {
            return [
                ['name' => 'Glucosa', 'code' => 'GLU', 'parameter_type' => 'numeric', 'unit' => 'mg/dL'],
            ];
        }

        if (str_contains($name, 'colesterol') || str_contains($name, 'lipid') || str_contains($name, 'triglicer')) {
            return [
                ['name' => 'Colesterol Total', 'code' => 'CHOL', 'parameter_type' => 'numeric', 'unit' => 'mg/dL'],
                ['name' => 'Trigliceridos', 'code' => 'TRIG', 'parameter_type' => 'numeric', 'unit' => 'mg/dL'],
                ['name' => 'HDL', 'code' => 'HDL', 'parameter_type' => 'numeric', 'unit' => 'mg/dL'],
                ['name' => 'LDL', 'code' => 'LDL', 'parameter_type' => 'numeric', 'unit' => 'mg/dL'],
            ];
        }

        return [
            ['name' => 'Resultado', 'code' => 'RESULT', 'parameter_type' => 'text', 'unit' => ''],
        ];
    }
}
