<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\MedicalService;
use App\Models\ServiceCategory;
use App\Models\LegacyServiceMapping;
use App\Helpers\ServiceCodeHelper;
use Carbon\Carbon;

class ServicesFromLegacySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Iniciando migración de servicios desde legacy...');

        // Mapeo DIRECTO: legacy_id = aranto_id (sin conversión)
        // Solo se migran categorías de SERVICIOS MÉDICOS
        // EXCLUIDAS: 38 (Cocina), 42 (Medicamentos), 43 (Descartables), 44 (Otros Farmacia)
        $categoriesAllowed = [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 39, 40, 41, 45, 46, 47, 48];
        $categoriesExcluded = [38, 42, 43, 44]; // Cocina, Medicamentos, Descartables, Otros Farmacia

        // Verify categories exist
        $this->command->info('Verificando categorías de servicios médicos...');
        $categoriesMap = [];
        
        foreach ($categoriesAllowed as $categoryId) {
            $category = ServiceCategory::find($categoryId);
            if ($category) {
                $categoriesMap[$categoryId] = $categoryId; // Mapeo 1:1
                $this->command->line("  ✓ Categoría {$categoryId}: {$category->name}");
            } else {
                $this->command->warn("  ⊘ Categoría {$categoryId} no existe en aranto");
            }
        }

        $this->command->info('');
        $this->command->warn('Categorías EXCLUIDAS de la migración:');
        foreach ($categoriesExcluded as $catId) {
            $this->command->line("  ✗ ID {$catId}");
        }
        $this->command->info('');

        // Get products from legacy - SOLO de categorías permitidas
        $this->command->info('Obteniendo productos de legacy...');
        $legacyProducts = DB::connection('legacy')
            ->table('producto')
            ->whereIn('IdCategoria', $categoriesAllowed)
            ->where('Estado', 'ACTIVO')
            ->get();

        $this->command->info("Encontrados {$legacyProducts->count()} productos activos en legacy");
        $this->command->info('');

        $createdCount = 0;
        $skippedCount = 0;
        $failedCount = 0;

        foreach ($legacyProducts as $product) {
            try {
                // Sanitize service name: remove accents and convert to Title Case
                $sanitizedName = ServiceCodeHelper::sanitizeServiceName(trim($product->Nombre));
                
                // Capitalize professional names (Dr., Dra., Lic., etc.)
                $sanitizedName = ServiceCodeHelper::capitalizeProfileName($sanitizedName);
                
                // Check if service already exists by code or name
                $existingService = MedicalService::where('code', $this->generateCode($sanitizedName))
                    ->orWhere('name', $sanitizedName)
                    ->first();

                if ($existingService) {
                    $this->command->line("  ⊘ Omitido (existe): {$product->Nombre}");
                    
                    // Still create mapping for existing service to enable price migration
                    LegacyServiceMapping::updateOrCreate(
                        ['legacy_product_id' => $product->IdProducto],
                        [
                            'service_id' => $existingService->id,
                            'legacy_name' => trim($product->Nombre),
                        ]
                    );
                    
                    $skippedCount++;
                    continue;
                }

                // Sanitize service name: remove accents and convert to Title Case
                $sanitizedName = ServiceCodeHelper::sanitizeServiceName(trim($product->Nombre));
                
                // Capitalize professional names (Dr., Dra., Lic., etc.)
                $sanitizedName = ServiceCodeHelper::capitalizeProfileName($sanitizedName);
                
                // Create medical service
                $service = MedicalService::create([
                    'name' => $sanitizedName,
                    'description' => trim($product->Descripcion) ?: null,
                    'code' => $this->generateCode($sanitizedName),
                    'status' => 'active',
                ]);

                // Assign category
                if (isset($categoriesMap[$product->IdCategoria])) {
                    $service->category_id = $categoriesMap[$product->IdCategoria];
                    $service->save();
                }

                // Store mapping from legacy product ID to aranto service ID
                LegacyServiceMapping::create([
                    'legacy_product_id' => $product->IdProducto,
                    'service_id' => $service->id,
                    'legacy_name' => trim($product->Nombre),
                ]);

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
        
        while (MedicalService::where('code', $finalCode)->exists()) {
            // Add numeric suffix to make it unique
            $finalCode = substr($baseCode, 0, 9 - strlen($counter)) . $counter;
            $counter++;
        }

        return $finalCode;
    }
}
