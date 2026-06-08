<?php

namespace Database\Seeders;

use App\Models\MedicalService;
use App\Models\ServiceCategory;
use App\Models\ServicePrice;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MedicalServicesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Idempotente y autosuficiente: crea sus propias categorías (firstOrCreate)
     * en lugar de depender de que existan, y usa firstOrCreate para servicios y
     * precios. Seguro para correr en cada despliegue.
     */
    public function run(): void
    {
        $insuranceTypes = DB::table('insurance_types')->pluck('id', 'code');

        $services = [
            // CONSULTAS
            [
                'name' => 'Consulta General',
                'code' => 'CONS_GEN',
                'description' => 'Consulta médica general con médico clínico',
                'category' => 'Consultas',
                'duration_minutes' => 30,
                'requires_appointment' => true,
                'default_commission_percentage' => 70.00,
                'prices' => [
                    'PARTICULAR' => 150000.00,
                    'UNIMED' => 180000.00,
                    'OSDE' => 200000.00,
                    'SWISS' => 190000.00
                ]
            ],
            [
                'name' => 'Consulta Cardiológica',
                'code' => 'CONS_CARDIO',
                'description' => 'Consulta especializada en cardiología',
                'category' => 'Consultas',
                'duration_minutes' => 45,
                'requires_appointment' => true,
                'default_commission_percentage' => 75.00,
                'prices' => [
                    'PARTICULAR' => 250000.00,
                    'UNIMED' => 300000.00,
                    'OSDE' => 320000.00,
                    'SWISS' => 310000.00
                ]
            ],
            [
                'name' => 'Electrocardiograma',
                'code' => 'ECG',
                'description' => 'Electrocardiograma de 12 derivaciones',
                'category' => 'Estudios de Imagen',
                'duration_minutes' => 20,
                'requires_appointment' => false,
                'default_commission_percentage' => 50.00,
                'prices' => [
                    'PARTICULAR' => 80000.00,
                    'UNIMED' => 100000.00,
                    'OSDE' => 110000.00,
                    'SWISS' => 105000.00
                ]
            ]
        ];

        foreach ($services as $serviceData) {
            $prices = $serviceData['prices'];

            $category = ServiceCategory::firstOrCreate(
                ['name' => $serviceData['category']],
                ['description' => $serviceData['category'], 'status' => 'active']
            );

            $service = MedicalService::firstOrCreate(
                ['code' => $serviceData['code']],
                [
                    'name' => $serviceData['name'],
                    'description' => $serviceData['description'],
                    'category_id' => $category->id,
                    'duration_minutes' => $serviceData['duration_minutes'],
                    'requires_appointment' => $serviceData['requires_appointment'],
                    'default_commission_percentage' => $serviceData['default_commission_percentage'],
                    'status' => 'active',
                ]
            );

            foreach ($prices as $insuranceCode => $price) {
                if (isset($insuranceTypes[$insuranceCode])) {
                    ServicePrice::firstOrCreate(
                        [
                            'service_id' => $service->id,
                            'insurance_type_id' => $insuranceTypes[$insuranceCode],
                            'effective_from' => '2025-01-01',
                        ],
                        [
                            'price' => $price,
                            'effective_until' => null,
                            'notes' => 'Precio inicial del sistema',
                        ]
                    );
                }
            }
        }
    }
}
