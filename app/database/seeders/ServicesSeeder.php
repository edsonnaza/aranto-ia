<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ServicesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * NOTA: Este seeder fue actualizado para usar MedicalService en lugar de Service (tabla legacy).
     * Los servicios médicos ahora se cargan desde MedicalServicesSeeder y desde legacy migration.
     */
    public function run(): void
    {
        // Este seeder se mantiene vacío para evitar duplicados
        // Los servicios se cargan desde:
        // 1. MedicalServicesSeeder - para servicios base
        // 2. MasterLegacyMigrationSeeder - para servicios desde legacy
    }
}
