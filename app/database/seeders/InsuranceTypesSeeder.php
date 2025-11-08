<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InsuranceTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $insuranceTypes = [
            [
                'name' => 'Particular',
                'code' => 'PARTICULAR',
                'description' => 'Pacientes sin seguro médico que abonan particular',
                'requires_authorization' => false,
                'coverage_percentage' => 100.00,
                'has_copay' => false,
                'copay_amount' => 0.00,
                'status' => 'active'
            ],
            [
                'name' => 'Unimed',
                'code' => 'UNIMED',
                'description' => 'Unimed Paraguay - Seguro médico privado',
                'requires_authorization' => true,
                'coverage_percentage' => 80.00,
                'has_copay' => true,
                'copay_amount' => 50000.00,
                'contact_name' => 'Servicios Médicos Unimed',
                'contact_phone' => '021-123456',
                'contact_email' => 'servicios@unimed.com.py',
                'status' => 'active'
            ],
            [
                'name' => 'OSDE',
                'code' => 'OSDE',
                'description' => 'OSDE Paraguay - Obra Social',
                'requires_authorization' => true,
                'coverage_percentage' => 85.00,
                'has_copay' => true,
                'copay_amount' => 40000.00,
                'contact_name' => 'OSDE Servicios',
                'contact_phone' => '021-789012',
                'contact_email' => 'autorizaciones@osde.com.py',
                'status' => 'active'
            ],
            [
                'name' => 'Swiss Medical',
                'code' => 'SWISS',
                'description' => 'Swiss Medical Paraguay',
                'requires_authorization' => true,
                'coverage_percentage' => 90.00,
                'has_copay' => false,
                'copay_amount' => 0.00,
                'contact_name' => 'Swiss Medical Servicios',
                'contact_phone' => '021-345678',
                'contact_email' => 'servicios@swissmedical.com.py',
                'status' => 'active'
            ]
        ];

        foreach ($insuranceTypes as $insuranceType) {
            DB::table('insurance_types')->insert(array_merge($insuranceType, [
                'created_at' => now(),
                'updated_at' => now()
            ]));
        }
    }
}
