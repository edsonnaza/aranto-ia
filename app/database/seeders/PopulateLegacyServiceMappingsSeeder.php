<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Service;
use App\Models\LegacyServiceMapping;

class PopulateLegacyServiceMappingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Poblando tabla de mappings entre legacy y aranto...');

        $legacyProducts = DB::connection('legacy')
            ->table('producto')
            ->whereIn('IdCategoria', [22, 23, 24, 25])
            ->where('Estado', 'ACTIVO')
            ->get();

        $createdCount = 0;
        $skippedCount = 0;

        foreach ($legacyProducts as $product) {
            // Check if mapping already exists
            $existingMapping = LegacyServiceMapping::where('legacy_product_id', $product->IdProducto)->first();
            if ($existingMapping) {
                $skippedCount++;
                continue;
            }

            // Find service by name
            $service = Service::where('name', trim($product->Nombre))->first();
            
            if ($service) {
                LegacyServiceMapping::create([
                    'legacy_product_id' => $product->IdProducto,
                    'service_id' => $service->id,
                    'legacy_name' => trim($product->Nombre),
                ]);
                $createdCount++;
                $this->command->line("  ✓ Mapeado: legacy_id={$product->IdProducto} -> service_id={$service->id}");
            }
        }

        $this->command->info('');
        $this->command->info('Población completada:');
        $this->command->line("  ✓ Mappings creados: {$createdCount}");
        $this->command->line("  ⊘ Ya existentes: {$skippedCount}");
    }
}
