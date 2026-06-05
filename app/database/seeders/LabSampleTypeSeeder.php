<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Laboratory\LabSampleType;

class LabSampleTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sampleTypes = [
            [
                'name' => 'Sangre Total',
                'code' => 'BLOOD',
                'description' => 'Muestra de sangre completa sin procesar',
                'container_type' => 'Tubo tapa lila (EDTA)',
                'preservation_requirements' => 'Refrigeración 2-8°C',
                'stability_hours' => 24,
                'status' => 'active',
            ],
            [
                'name' => 'Suero',
                'code' => 'SERUM',
                'description' => 'Sangre sin anticoagulante, centrifugada',
                'container_type' => 'Tubo tapa roja o amarilla',
                'preservation_requirements' => 'Refrigeración 2-8°C o congelación',
                'stability_hours' => 48,
                'status' => 'active',
            ],
            [
                'name' => 'Plasma',
                'code' => 'PLASMA',
                'description' => 'Sangre con anticoagulante, centrifugada',
                'container_type' => 'Tubo tapa verde (Heparina)',
                'preservation_requirements' => 'Refrigeración 2-8°C',
                'stability_hours' => 24,
                'status' => 'active',
            ],
            [
                'name' => 'Orina',
                'code' => 'URINE',
                'description' => 'Muestra de orina (primera de la mañana preferible)',
                'container_type' => 'Frasco estéril de boca ancha',
                'preservation_requirements' => 'Refrigeración 2-8°C',
                'stability_hours' => 2,
                'status' => 'active',
            ],
            [
                'name' => 'Orina 24 horas',
                'code' => 'URINE24H',
                'description' => 'Recolección de orina durante 24 horas',
                'container_type' => 'Recipiente grande con conservante',
                'preservation_requirements' => 'Refrigeración durante recolección',
                'stability_hours' => 4,
                'status' => 'active',
            ],
            [
                'name' => 'Heces',
                'code' => 'STOOL',
                'description' => 'Muestra fecal',
                'container_type' => 'Frasco estéril con tapa hermética',
                'preservation_requirements' => 'Temperatura ambiente o refrigeración según análisis',
                'stability_hours' => 2,
                'status' => 'active',
            ],
            [
                'name' => 'Esputo',
                'code' => 'SPUTUM',
                'description' => 'Secreción bronquial',
                'container_type' => 'Frasco estéril de boca ancha',
                'preservation_requirements' => 'Temperatura ambiente, procesamiento inmediato',
                'stability_hours' => 1,
                'status' => 'active',
            ],
            [
                'name' => 'Hisopado Faríngeo',
                'code' => 'THROAT_SWAB',
                'description' => 'Muestra de garganta con hisopo',
                'container_type' => 'Hisopo con medio de transporte',
                'preservation_requirements' => 'Temperatura ambiente',
                'stability_hours' => 24,
                'status' => 'active',
            ],
            [
                'name' => 'Hisopado Nasal',
                'code' => 'NASAL_SWAB',
                'description' => 'Muestra nasal con hisopo',
                'container_type' => 'Hisopo con medio de transporte',
                'preservation_requirements' => 'Temperatura ambiente',
                'stability_hours' => 24,
                'status' => 'active',
            ],
            [
                'name' => 'Líquido Cefalorraquídeo (LCR)',
                'code' => 'CSF',
                'description' => 'Muestra de líquido cefalorraquídeo',
                'container_type' => 'Tubo estéril',
                'preservation_requirements' => 'Temperatura ambiente, procesamiento INMEDIATO',
                'stability_hours' => 1,
                'status' => 'active',
            ],
            [
                'name' => 'Líquido Sinovial',
                'code' => 'SYNOVIAL',
                'description' => 'Muestra de líquido articular',
                'container_type' => 'Tubo estéril',
                'preservation_requirements' => 'Temperatura ambiente',
                'stability_hours' => 2,
                'status' => 'active',
            ],
            [
                'name' => 'Exudado',
                'code' => 'EXUDATE',
                'description' => 'Muestra de secreción o exudado de heridas',
                'container_type' => 'Hisopo con medio de transporte',
                'preservation_requirements' => 'Temperatura ambiente',
                'stability_hours' => 24,
                'status' => 'active',
            ],
            [
                'name' => 'Biopsia',
                'code' => 'BIOPSY',
                'description' => 'Muestra de tejido',
                'container_type' => 'Frasco con formol al 10%',
                'preservation_requirements' => 'Fijación con formol',
                'stability_hours' => null,
                'status' => 'active',
            ],
        ];

        foreach ($sampleTypes as $sampleType) {
            LabSampleType::firstOrCreate(
                ['code' => $sampleType['code']],
                $sampleType
            );
        }
    }
}
