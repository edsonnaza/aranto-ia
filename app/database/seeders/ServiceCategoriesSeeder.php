<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServiceCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Consultas',
                'description' => 'Consultas médicas generales y especializadas',
                'status' => 'active'
            ],
            [
                'name' => 'Estudios de Imagen',
                'description' => 'Radiografías, ecografías, tomografías, resonancias',
                'status' => 'active'
            ],
            [
                'name' => 'Análisis Clínicos',
                'description' => 'Estudios de laboratorio, análisis de sangre, orina',
                'status' => 'active'
            ],
            [
                'name' => 'Cirugías',
                'description' => 'Procedimientos quirúrgicos ambulatorios y complejos',
                'status' => 'active'
            ],
            [
                'name' => 'Emergencias',
                'description' => 'Atención de emergencias y urgencias médicas',
                'status' => 'active'
            ]
        ];

        foreach ($categories as $category) {
            DB::table('service_categories')->insert(array_merge($category, [
                'created_at' => now(),
                'updated_at' => now()
            ]));
        }
    }
}
