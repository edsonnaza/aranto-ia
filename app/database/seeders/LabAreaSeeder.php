<?php

namespace Database\Seeders;

use App\Models\Laboratory\LabArea;
use App\Models\Laboratory\LabTestProfile;
use App\Models\Laboratory\LabEquipment;
use Illuminate\Database\Seeder;

class LabAreaSeeder extends Seeder
{
    public function run(): void
    {
        // Create initial lab areas
        $areas = [
            [
                'name' => 'Hematología',
                'code' => 'HEMA',
                'description' => 'Análisis de sangre y componentes celulares',
                'status' => 'active',
                'display_order' => 1,
            ],
            [
                'name' => 'Bioquímica',
                'code' => 'BIO',
                'description' => 'Análisis de compuestos químicos en fluidos',
                'status' => 'active',
                'display_order' => 2,
            ],
            [
                'name' => 'Inmunología',
                'code' => 'INMU',
                'description' => 'Serología, hormonas y marcadores inmunológicos',
                'status' => 'active',
                'display_order' => 3,
            ],
            [
                'name' => 'Microbiología',
                'code' => 'MICRO',
                'description' => 'Cultivos, antibiogramas e identificación de microorganismos',
                'status' => 'active',
                'display_order' => 4,
            ],
        ];

        foreach ($areas as $area) {
            LabArea::firstOrCreate(
                ['code' => $area['code']],
                $area
            );
        }

        // Backfill: Assign areas to existing test profiles
        $profileMapping = [
            'Hemograma Completo' => 'HEMA',
            'Coagulograma' => 'HEMA',
            'Glucemia' => 'BIO',
            'Perfil Lipídico' => 'BIO',
            'Función Renal' => 'BIO',
            'Hepatograma' => 'BIO',
            'Orina Completa' => 'BIO',
        ];

        foreach ($profileMapping as $profileName => $areaCode) {
            $area = LabArea::where('code', $areaCode)->first();
            if ($area) {
                LabTestProfile::where('name', $profileName)
                    ->whereNull('lab_area_id')
                    ->update(['lab_area_id' => $area->id]);
            }
        }

        // Backfill: Assign areas to existing equipment
        $equipmentMapping = [
            'HEMA-AUTO-01' => 'HEMA',
            'CHEM-AUTO-01' => 'BIO',
            'COAG-AUTO-01' => 'HEMA',
            'IMMU-AUTO-01' => 'INMU',
            'URIN-AUTO-01' => 'BIO',
            'MICRO-DIG-01' => 'MICRO',
            // 'CENT-01' => null, // shared equipment - leave without area
        ];

        foreach ($equipmentMapping as $equipmentName => $areaCode) {
            $area = LabArea::where('code', $areaCode)->first();
            if ($area) {
                LabEquipment::where('name', $equipmentName)
                    ->whereNull('lab_area_id')
                    ->update(['lab_area_id' => $area->id]);
            }
        }
    }
}
