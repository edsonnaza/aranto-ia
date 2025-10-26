<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            // Consultas
            [
                'code' => 'CONS001',
                'name' => 'Consulta Médica General',
                'description' => 'Consulta médica general con médico de familia',
                'base_price' => 150.00,
                'category' => 'CONSULTATION',
                'professional_commission_percentage' => 30.00,
            ],
            [
                'code' => 'CONS002',
                'name' => 'Consulta Especialista',
                'description' => 'Consulta con médico especialista',
                'base_price' => 300.00,
                'category' => 'CONSULTATION',
                'professional_commission_percentage' => 35.00,
            ],
            [
                'code' => 'CONS003',
                'name' => 'Consulta Pediatría',
                'description' => 'Consulta médica pediátrica',
                'base_price' => 180.00,
                'category' => 'CONSULTATION',
                'professional_commission_percentage' => 30.00,
            ],

            // Procedimientos
            [
                'code' => 'PROC001',
                'name' => 'Electrocardiograma',
                'description' => 'Electrocardiograma de 12 derivaciones',
                'base_price' => 120.00,
                'category' => 'PROCEDURE',
                'professional_commission_percentage' => 25.00,
            ],
            [
                'code' => 'PROC002',
                'name' => 'Sutura Simple',
                'description' => 'Sutura de herida superficial',
                'base_price' => 200.00,
                'category' => 'PROCEDURE',
                'professional_commission_percentage' => 40.00,
            ],
            [
                'code' => 'PROC003',
                'name' => 'Curaciones',
                'description' => 'Curación y cambio de vendajes',
                'base_price' => 80.00,
                'category' => 'PROCEDURE',
                'professional_commission_percentage' => 20.00,
            ],

            // Urgencias
            [
                'code' => 'EMER001',
                'name' => 'Atención de Urgencia',
                'description' => 'Atención médica de urgencia',
                'base_price' => 500.00,
                'category' => 'EMERGENCY',
                'professional_commission_percentage' => 35.00,
            ],
            [
                'code' => 'EMER002',
                'name' => 'Urgencia Pediátrica',
                'description' => 'Atención de urgencia pediátrica',
                'base_price' => 450.00,
                'category' => 'EMERGENCY',
                'professional_commission_percentage' => 35.00,
            ],

            // Hospitalización
            [
                'code' => 'HOSP001',
                'name' => 'Día de Internación',
                'description' => 'Costo por día de internación',
                'base_price' => 800.00,
                'category' => 'HOSPITALIZATION',
                'professional_commission_percentage' => 20.00,
            ],
            [
                'code' => 'HOSP002',
                'name' => 'Habitación Privada',
                'description' => 'Día de internación en habitación privada',
                'base_price' => 1200.00,
                'category' => 'HOSPITALIZATION',
                'professional_commission_percentage' => 15.00,
            ],

            // Diagnósticos
            [
                'code' => 'DIAG001',
                'name' => 'Radiografía Simple',
                'description' => 'Radiografía simple de una proyección',
                'base_price' => 250.00,
                'category' => 'DIAGNOSTIC',
                'professional_commission_percentage' => 25.00,
            ],
            [
                'code' => 'DIAG002',
                'name' => 'Ecografía Abdominal',
                'description' => 'Ecografía de abdomen completo',
                'base_price' => 400.00,
                'category' => 'DIAGNOSTIC',
                'professional_commission_percentage' => 30.00,
            ],
            [
                'code' => 'DIAG003',
                'name' => 'Laboratorio Básico',
                'description' => 'Análisis de laboratorio básico',
                'base_price' => 180.00,
                'category' => 'DIAGNOSTIC',
                'professional_commission_percentage' => 20.00,
            ],

            // Otros servicios
            [
                'code' => 'OTHE001',
                'name' => 'Certificado Médico',
                'description' => 'Emisión de certificado médico',
                'base_price' => 50.00,
                'category' => 'OTHER',
                'professional_commission_percentage' => 10.00,
            ],
            [
                'code' => 'OTHE002',
                'name' => 'Aplicación de Inyectable',
                'description' => 'Aplicación de medicamento inyectable',
                'base_price' => 60.00,
                'category' => 'OTHER',
                'professional_commission_percentage' => 15.00,
            ],
        ];

        foreach ($services as $service) {
            Service::create($service);
        }
    }
}
