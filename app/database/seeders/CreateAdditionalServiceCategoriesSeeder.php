<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ServiceCategory;

class CreateAdditionalServiceCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creando categorías adicionales...');

        // Legacy categories to create in aranto
        $categoriesToCreate = [
            26 => 'Servicios Radiologia IMAP',
            27 => 'Servicios Ecografias',
            28 => 'Alquileres',
            29 => 'Servicios de Urgencia',
            30 => 'Servicios de Analisis',
            31 => 'Consulta en Urgencia',
            32 => 'Odontologia',
            33 => 'IMAP S.A',
            34 => 'Servicios de RX',
            35 => 'Mamografia',
            36 => 'Ecografias de Urgencias',
            37 => 'Procedimientos Generales',
            40 => 'MASTOLOGIA',
            41 => 'MASTOLOGIA Especial',
            45 => 'Honorario Medico Particular',
            46 => 'Honorario Medico Unimed',
            47 => 'Sala Internacion',
            48 => 'Tes De Marcha',
        ];

        $createdCount = 0;
        $skippedCount = 0;

        foreach ($categoriesToCreate as $legacyId => $categoryName) {
            // Check if category already exists by name
            $existing = ServiceCategory::where('name', $categoryName)->first();
            
            if ($existing) {
                $this->command->line("  ⊘ Ya existe: {$categoryName} (ID: {$existing->id})");
                $skippedCount++;
            } else {
                $category = ServiceCategory::create([
                    'name' => $categoryName,
                    'status' => 'active',
                ]);
                
                $this->command->line("  ✓ Creada: {$categoryName} (ID: {$category->id}, Legacy: {$legacyId})");
                $createdCount++;
            }
        }

        $this->command->info('');
        $this->command->info('Resumen:');
        $this->command->line("  ✓ Categorías creadas: {$createdCount}");
        $this->command->line("  ⊘ Categorías existentes: {$skippedCount}");
    }
}
