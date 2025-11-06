<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Service;

class ServicesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            // Consultas Médicas
            [
                'code' => 'CONS001',
                'name' => 'Consulta Médica General',
                'description' => 'Consulta médica de medicina general',
                'base_price' => 50.00,
                'category' => 'CONSULTATION',
                'is_active' => true,
                'professional_commission_percentage' => 60.0,
            ],
            [
                'code' => 'CONS002',
                'name' => 'Consulta de Especialidad',
                'description' => 'Consulta médica especializada',
                'base_price' => 80.00,
                'category' => 'CONSULTATION',
                'is_active' => true,
                'professional_commission_percentage' => 65.0,
            ],
            [
                'code' => 'CONS003',
                'name' => 'Consulta de Control',
                'description' => 'Consulta de seguimiento y control',
                'base_price' => 40.00,
                'category' => 'CONSULTATION',
                'is_active' => true,
                'professional_commission_percentage' => 60.0,
            ],

            // Exámenes y Diagnósticos
            [
                'code' => 'EXAM001',
                'name' => 'Electrocardiograma',
                'description' => 'Examen de electrocardiograma',
                'base_price' => 25.00,
                'category' => 'DIAGNOSTIC',
                'is_active' => true,
                'professional_commission_percentage' => 40.0,
            ],
            [
                'code' => 'EXAM002',
                'name' => 'Radiografía Simple',
                'description' => 'Radiografía simple de una proyección',
                'base_price' => 35.00,
                'category' => 'DIAGNOSTIC',
                'is_active' => true,
                'professional_commission_percentage' => 45.0,
            ],
            [
                'code' => 'EXAM003',
                'name' => 'Ecografía',
                'description' => 'Examen de ecografía',
                'base_price' => 60.00,
                'category' => 'DIAGNOSTIC',
                'is_active' => true,
                'professional_commission_percentage' => 50.0,
            ],

            // Procedimientos
            [
                'code' => 'PROC001',
                'name' => 'Inyección Intramuscular',
                'description' => 'Aplicación de inyección intramuscular',
                'base_price' => 10.00,
                'category' => 'PROCEDURE',
                'is_active' => true,
                'professional_commission_percentage' => 30.0,
            ],
            [
                'code' => 'PROC002',
                'name' => 'Curación Simple',
                'description' => 'Curación de herida simple',
                'base_price' => 15.00,
                'category' => 'PROCEDURE',
                'is_active' => true,
                'professional_commission_percentage' => 35.0,
            ],
            [
                'code' => 'PROC003',
                'name' => 'Sutura Simple',
                'description' => 'Sutura de herida simple',
                'base_price' => 45.00,
                'category' => 'PROCEDURE',
                'is_active' => true,
                'professional_commission_percentage' => 50.0,
            ],

            // Laboratorio
            [
                'code' => 'LAB001',
                'name' => 'Hemograma Completo',
                'description' => 'Examen de hemograma completo',
                'base_price' => 20.00,
                'category' => 'DIAGNOSTIC',
                'is_active' => true,
                'professional_commission_percentage' => 25.0,
            ],
            [
                'code' => 'LAB002',
                'name' => 'Glicemia',
                'description' => 'Examen de glucosa en sangre',
                'base_price' => 8.00,
                'category' => 'DIAGNOSTIC',
                'is_active' => true,
                'professional_commission_percentage' => 25.0,
            ],
            [
                'code' => 'LAB003',
                'name' => 'Perfil Lipídico',
                'description' => 'Examen de perfil lipídico completo',
                'base_price' => 30.00,
                'category' => 'DIAGNOSTIC',
                'is_active' => true,
                'professional_commission_percentage' => 30.0,
            ],

            // Terapias
            [
                'code' => 'THER001',
                'name' => 'Fisioterapia',
                'description' => 'Sesión de fisioterapia',
                'base_price' => 25.00,
                'category' => 'PROCEDURE',
                'is_active' => true,
                'professional_commission_percentage' => 55.0,
            ],
            [
                'code' => 'THER002',
                'name' => 'Terapia Respiratoria',
                'description' => 'Sesión de terapia respiratoria',
                'base_price' => 20.00,
                'category' => 'PROCEDURE',
                'is_active' => true,
                'professional_commission_percentage' => 50.0,
            ],

            // Urgencias
            [
                'code' => 'URG001',
                'name' => 'Atención de Urgencias',
                'description' => 'Atención médica de urgencias',
                'base_price' => 75.00,
                'category' => 'EMERGENCY',
                'is_active' => true,
                'professional_commission_percentage' => 70.0,
            ],
        ];

        foreach ($services as $serviceData) {
            Service::firstOrCreate(
                ['name' => $serviceData['name']],
                $serviceData
            );
        }

        $this->command->info('Medical services seeded successfully.');
    }
}