<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Service;
use App\Models\ServiceCategory;
use Carbon\Carbon;

class ServicesFromLegacySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Iniciando migración de servicios desde legacy...');

        // Map legacy category IDs to aranto service_categories IDs
        $categoryMapping = [
            22 => 7,   // Legacy 22 (Servicios Sanatoriales) -> Aranto 7
            23 => 8,   // Legacy 23 (Consultas Consultorios) -> Aranto 8
            24 => 10,  // Legacy 24 (Servicios Cardiologia) -> Aranto 10
            25 => 9,   // Legacy 25 (Servicios Otorrinonaringologia) -> Aranto 9
        ];

        // Verify categories exist
        $this->command->info('Verificando categorías...');
        $categoriesMap = [];
        
        foreach ($categoryMapping as $legacyId => $arantoId) {
            $category = ServiceCategory::find($arantoId);
            if ($category) {
                $categoriesMap[$legacyId] = $arantoId;
                $this->command->line("  ✓ Categoría {$legacyId} -> {$arantoId}: {$category->name}");
            } else {
                $this->command->warn("  ⊘ Categoría {$arantoId} no existe en aranto");
            }
        }

        // Get products from legacy
        $this->command->info('Obteniendo productos de legacy...');
        $legacyProducts = DB::connection('legacy')
            ->table('producto')
            ->whereIn('IdCategoria', [22, 23, 24, 25])
            ->where('Estado', 'ACTIVO')
            ->get();

        $this->command->info("Encontrados {$legacyProducts->count()} productos activos en legacy");
        $this->command->info('');

        $createdCount = 0;
        $skippedCount = 0;
        $failedCount = 0;

        foreach ($legacyProducts as $product) {
            try {
                // Check if service already exists by code or name
                $existingService = Service::where('code', $this->generateCode(trim($product->Nombre)))
                    ->orWhere('name', trim($product->Nombre))
                    ->first();

                if ($existingService) {
                    $this->command->line("  ⊘ Omitido (existe): {$product->Nombre}");
                    $skippedCount++;
                    continue;
                }

                // Create service
                $service = Service::create([
                    'name' => trim($product->Nombre),
                    'description' => trim($product->Descripcion) ?: null,
                    'code' => $this->generateCode(trim($product->Nombre)),
                    'base_price' => (float) ($product->PrecioVenta ?? 0),
                    'category' => 'CONSULTATION', // Default category enum value
                    'is_active' => true,
                    'professional_commission_percentage' => 0,
                ]);

                // Attach category using pivot table
                if (isset($categoriesMap[$product->IdCategoria])) {
                    $service->serviceCategories()->attach($categoriesMap[$product->IdCategoria]);
                }

                $this->command->line("  ✓ Creado: {$service->name} (ID: {$service->id})");
                $createdCount++;

            } catch (\Exception $e) {
                $this->command->error("  ✗ Error en producto {$product->IdProducto}: {$e->getMessage()}");
                $failedCount++;
            }
        }

        $this->command->info('');
        $this->command->info('Migración completada:');
        $this->command->line("  ✓ Servicios creados: {$createdCount}");
        $this->command->line("  ⊘ Omitidos: {$skippedCount}");
        if ($failedCount > 0) {
            $this->command->warn("  ✗ Fallidos: {$failedCount}");
        }
    }

    /**
     * Generate unique service code from name
     */
    private function generateCode(string $name): string
    {
        // Get first letters of words, max 8 chars
        $words = explode(' ', $name);
        $code = '';
        
        foreach ($words as $word) {
            if (strlen($code) < 8 && !empty($word)) {
                $code .= strtoupper(substr($word, 0, 1));
            }
        }

        $baseCode = $code ?: 'SRV';

        // Ensure uniqueness by checking if code exists and appending suffix if needed
        $finalCode = $baseCode;
        $counter = 1;
        
        while (Service::where('code', $finalCode)->exists()) {
            // Add numeric suffix to make it unique
            $finalCode = substr($baseCode, 0, 9 - strlen($counter)) . $counter;
            $counter++;
        }

        return $finalCode;
    }
}
