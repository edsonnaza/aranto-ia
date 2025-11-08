<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MedicalServicesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Primero obtenemos los IDs de las categorías y seguros
        $categories = DB::table('service_categories')->pluck('id', 'name');
        $insuranceTypes = DB::table('insurance_types')->pluck('id', 'code');
        
        $services = [
            // CONSULTAS
            [
                'name' => 'Consulta General',
                'code' => 'CONS_GEN',
                'description' => 'Consulta médica general con médico clínico',
                'category_id' => $categories['Consultas'],
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
                'category_id' => $categories['Consultas'],
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
                'category_id' => $categories['Estudios de Imagen'],
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
            // Crear el servicio
            $prices = $serviceData['prices'];
            unset($serviceData['prices']);
            
            $serviceId = DB::table('medical_services')->insertGetId(array_merge($serviceData, [
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now()
            ]));
            
            // Crear los precios para cada tipo de seguro
            foreach ($prices as $insuranceCode => $price) {
                if (isset($insuranceTypes[$insuranceCode])) {
                    DB::table('service_prices')->insert([
                        'service_id' => $serviceId,
                        'insurance_type_id' => $insuranceTypes[$insuranceCode],
                        'price' => $price,
                        'effective_from' => '2025-01-01',
                        'effective_until' => null,
                        'created_by' => 1,
                        'notes' => 'Precio inicial del sistema',
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }
        }
    }
}
