<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LegacyCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Deshabilitar verificación de claves foráneas temporalmente
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // Limpiar tabla existente
        DB::table('service_categories')->truncate();
        
        // Insertar categorías exactamente como están en legacy
        // Se mantienen los IDs de legacy (22-48) para compatibilidad 100%
        $categories = [
            [
                'id' => 22,
                'name' => 'Servicios Sanatoriales',
                'description' => 'Servicios Sanatoriales',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 23,
                'name' => 'Consultas Consultorios',
                'description' => 'Consultas Consultorios',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 24,
                'name' => 'Servicios Cardiologia',
                'description' => 'Servicios Cardiologia',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 25,
                'name' => 'Servicios Otorrinonaringologia',
                'description' => 'Servicios Otorrinonaringologia',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 26,
                'name' => 'Servicios Radiologia IMAP',
                'description' => 'Servicios Radiologia IMAP',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 27,
                'name' => 'Servicios Ecografias',
                'description' => 'Servicios Ecografias',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 28,
                'name' => 'Alquileres',
                'description' => 'Alquileres',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 29,
                'name' => 'servicios de Urgencia',
                'description' => 'servicios de Urgencia',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 30,
                'name' => 'servicios de Analisis',
                'description' => 'servicios de Analisis',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 31,
                'name' => 'Consulta en Urgencia',
                'description' => 'Consulta en Urgencia',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 32,
                'name' => 'Odontologia',
                'description' => 'Odontologia',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 33,
                'name' => 'IMAP S.A',
                'description' => 'IMAP S.A',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 34,
                'name' => 'Servicios de RX',
                'description' => 'Servicios de RX',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 35,
                'name' => 'Mamografia',
                'description' => 'Mamografia',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 36,
                'name' => 'Ecografias de Urgencias',
                'description' => 'Ecografias de Urgencias',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 37,
                'name' => 'Procedimientos Generales',
                'description' => 'Procedimientos Generales',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 38,
                'name' => 'SERVICIOS DE COCINA',
                'description' => 'SERVICIOS DE COCINA',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 39,
                'name' => 'Servicios Corazón De Mamá',
                'description' => 'Servicios Corazón De Mamá',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 40,
                'name' => 'MASTOLOGIA',
                'description' => 'MASTOLOGIA',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 41,
                'name' => 'MASTOLOGIA',
                'description' => 'MASTOLOGIA',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 42,
                'name' => 'Medicamentos',
                'description' => 'Medicamentos',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 43,
                'name' => 'Descartables',
                'description' => 'Descartables',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 44,
                'name' => 'Otros Farmacia',
                'description' => 'Otros Farmacia',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 45,
                'name' => 'Honorario Medico Particular',
                'description' => 'Honorario Medico Particular',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 46,
                'name' => 'Honorario Medico Unimed',
                'description' => 'Honorario Medico Unimed',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 47,
                'name' => 'Sala Internacion',
                'description' => 'Sala Internacion',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 48,
                'name' => 'Tes De Marcha',
                'description' => 'Tes De Marcha',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('service_categories')->insert($categories);

        // Reabilitar verificación de claves foráneas
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        echo "✓ Insertadas 27 categorías de legacy (IDs 22-48)\n";
    }
}
