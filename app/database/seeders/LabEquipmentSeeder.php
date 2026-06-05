<?php

namespace Database\Seeders;

use App\Models\Laboratory\LabEquipment;
use Illuminate\Database\Seeder;

class LabEquipmentSeeder extends Seeder
{
    public function run(): void
    {
        $equipment = [
            [
                'name' => 'Analizador de Hematología Automático',
                'code' => 'HEMA-AUTO-01',
                'manufacturer' => 'Sysmex',
                'model' => 'XN-1000',
                'department' => 'Hematología',
                'status' => 'active',
                'notes' => 'Cuenta células completas, diferencial, reticulocitos',
            ],
            [
                'name' => 'Analizador de Química Clínica',
                'code' => 'CHEM-AUTO-01',
                'manufacturer' => 'Roche',
                'model' => 'Cobas 6000',
                'department' => 'Bioquímica',
                'status' => 'active',
                'notes' => 'Glucosa, lípidos, enzimas hepáticas y renales',
            ],
            [
                'name' => 'Analizador de Coagulación',
                'code' => 'COAG-AUTO-01',
                'manufacturer' => 'Sysmex',
                'model' => 'CA-7000',
                'department' => 'Hemostasia',
                'status' => 'active',
                'notes' => 'TP, TTPA, Trombina, Fibrinógeno',
            ],
            [
                'name' => 'Analizador de Inmunoquímica',
                'code' => 'IMMU-AUTO-01',
                'manufacturer' => 'Abbott',
                'model' => 'ARCHITECT i2000SR',
                'department' => 'Inmunología',
                'status' => 'active',
                'notes' => 'Hormonas, marcadores tumorales, serología',
            ],
            [
                'name' => 'Analizador de Orina',
                'code' => 'URIN-AUTO-01',
                'manufacturer' => 'Roche',
                'model' => 'cobas u 701',
                'department' => 'Urianálisis',
                'status' => 'active',
                'notes' => 'Análisis automático de orina completa',
            ],
            [
                'name' => 'Microscopio Digital',
                'code' => 'MICRO-DIG-01',
                'manufacturer' => 'Olympus',
                'model' => 'CX23',
                'department' => 'Microscopía',
                'status' => 'active',
                'notes' => 'Examen microscópico de muestras',
            ],
            [
                'name' => 'Centrifugadora',
                'code' => 'CENT-01',
                'manufacturer' => 'Eppendorf',
                'model' => '5810',
                'department' => 'Procesamiento',
                'status' => 'active',
                'notes' => 'Preparación de muestras',
            ],
        ];

        foreach ($equipment as $item) {
            LabEquipment::create($item);
        }
    }
}
