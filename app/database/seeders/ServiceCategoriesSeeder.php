<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServiceCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Inserta categorías de legacy que corresponden a SERVICIOS MÉDICOS únicamente
     * 
     * EXCLUIDAS (no son servicios médicos):
     * - 38: SERVICIOS DE COCINA
     * - 42: Medicamentos
     * - 43: Descartables
     * - 44: Otros Farmacia
     * 
     * Mapeo directo legacy → aranto (mismo ID)
     */
    public function run(): void
    {
        // Categorías de servicios médicos a migrar (preservando IDs de legacy)
        $categories = [
            ['id' => 22, 'name' => 'Servicios Sanatoriales', 'description' => 'Servicios Sanatoriales', 'status' => 'active'],
            ['id' => 23, 'name' => 'Consultas Consultorios', 'description' => 'Consultas Consultorios', 'status' => 'active'],
            ['id' => 24, 'name' => 'Servicios Cardiologia', 'description' => 'Servicios Cardiologia', 'status' => 'active'],
            ['id' => 25, 'name' => 'Servicios Otorrinonaringologia', 'description' => 'Servicios Otorrinonaringologia', 'status' => 'active'],
            ['id' => 26, 'name' => 'Servicios Radiologia IMAP', 'description' => 'Servicios Radiologia IMAP', 'status' => 'active'],
            ['id' => 27, 'name' => 'Servicios Ecografias', 'description' => 'Servicios Ecografias', 'status' => 'active'],
            ['id' => 28, 'name' => 'Alquileres', 'description' => 'Alquileres', 'status' => 'active'],
            ['id' => 29, 'name' => 'servicios de Urgencia', 'description' => 'servicios de Urgencia', 'status' => 'active'],
            ['id' => 30, 'name' => 'servicios de Analisis', 'description' => 'servicios de Analisis', 'status' => 'active'],
            ['id' => 31, 'name' => 'Consulta en Urgencia', 'description' => 'Consulta en Urgencia', 'status' => 'active'],
            ['id' => 32, 'name' => 'Odontologia', 'description' => 'Odontologia', 'status' => 'active'],
            ['id' => 33, 'name' => 'IMAP S.A', 'description' => 'IMAP S.A', 'status' => 'active'],
            ['id' => 34, 'name' => 'Servicios de RX', 'description' => 'Servicios de RX', 'status' => 'active'],
            ['id' => 35, 'name' => 'Mamografia', 'description' => 'Mamografia', 'status' => 'active'],
            ['id' => 36, 'name' => 'Ecografias de Urgencias', 'description' => 'Ecografias de Urgencias', 'status' => 'active'],
            ['id' => 37, 'name' => 'Procedimientos Generales', 'description' => 'Procedimientos Generales', 'status' => 'active'],
            // ID 38 EXCLUIDO: SERVICIOS DE COCINA
            ['id' => 39, 'name' => 'Servicios Corazón De Mamá', 'description' => 'Servicios Corazón De Mamá', 'status' => 'active'],
            ['id' => 40, 'name' => 'MASTOLOGIA', 'description' => 'MASTOLOGIA', 'status' => 'active'],
            ['id' => 41, 'name' => 'MASTOLOGIA', 'description' => 'MASTOLOGIA', 'status' => 'active'],
            // IDs 42-44 EXCLUIDOS: Medicamentos, Descartables, Otros Farmacia
            ['id' => 45, 'name' => 'Honorario Medico Particular', 'description' => 'Honorario Medico Particular', 'status' => 'active'],
            ['id' => 46, 'name' => 'Honorario Medico Unimed', 'description' => 'Honorario Medico Unimed', 'status' => 'active'],
            ['id' => 47, 'name' => 'Sala Internacion', 'description' => 'Sala Internacion', 'status' => 'active'],
            ['id' => 48, 'name' => 'Tes De Marcha', 'description' => 'Tes De Marcha', 'status' => 'active'],
        ];

        foreach ($categories as $category) {
            // Usar insertOrIgnore para no duplicar si ya existen
            DB::table('service_categories')->insertOrIgnore(array_merge($category, [
                'created_at' => now(),
                'updated_at' => now()
            ]));
        }
    }
}
