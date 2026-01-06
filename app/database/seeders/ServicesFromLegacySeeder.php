<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\MedicalService;
use App\Models\ServiceCategory;
use App\Models\ServicePrice;
use App\Models\InsuranceType;
use Carbon\Carbon;

class ServicesFromLegacySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Map legacy category IDs to aranto category IDs
        $categoryMapping = [
            22 => null, // Will find by name "Servicios Sanatoriales"
            23 => null, // Will find by name "Consultas Consultorios"
            25 => null, // Will find by name "Servicios Otorrinonaringologia"
        ];

        // Find actual category IDs in aranto
        $categories = ServiceCategory::whereIn('name', [
            'Servicios Sanatoriales',
            'Consultas Consultorios',
            'Servicios Otorrinonaringologia'
        ])->pluck('id', 'name')->toArray();

        // Create categories if they don't exist
        if (!isset($categories['Servicios Sanatoriales'])) {
            $cat = ServiceCategory::create([
                'name' => 'Servicios Sanatoriales',
                'status' => 'active'
            ]);
            $categoryMapping[22] = $cat->id;
        } else {
            $categoryMapping[22] = $categories['Servicios Sanatoriales'];
        }

        if (!isset($categories['Consultas Consultorios'])) {
            $cat = ServiceCategory::create([
                'name' => 'Consultas Consultorios',
                'status' => 'active'
            ]);
            $categoryMapping[23] = $cat->id;
        } else {
            $categoryMapping[23] = $categories['Consultas Consultorios'];
        }

        if (!isset($categories['Servicios Otorrinonaringologia'])) {
            $cat = ServiceCategory::create([
                'name' => 'Servicios Otorrinonaringologia',
                'status' => 'active'
            ]);
            $categoryMapping[25] = $cat->id;
        } else {
            $categoryMapping[25] = $categories['Servicios Otorrinonaringologia'];
        }

        // Insurance type mapping - legacy idseguro to aranto insurance_type_id
        $insuranceMapping = $this->buildInsuranceMapping();

        // Get connection to legacy database
        $legacyConnection = DB::connection('legacy');

        // Fetch products from legacy database (only from categories 22, 23, 25)
        $legacyProducts = $legacyConnection->table('producto')
            ->whereIn('IdCategoria', [22, 23, 25])
            ->where('Estado', 'ACTIVO')
            ->get();

        $this->command->info("Found {$legacyProducts->count()} products to migrate");

        $createdCount = 0;
        $skippedCount = 0;

        foreach ($legacyProducts as $product) {
            try {
                // Check if service already exists
                $existingService = MedicalService::where('name', $product->Nombre)->first();
                
                if ($existingService) {
                    $this->command->warn("Service '{$product->Nombre}' already exists, skipping");
                    $skippedCount++;
                    continue;
                }

                // Create the service
                $service = MedicalService::create([
                    'name' => $product->Nombre,
                    'description' => $product->Descripcion,
                    'category_id' => $categoryMapping[$product->IdCategoria],
                    'code' => $this->generateCode($product->Nombre),
                    'duration_minutes' => 30, // Default value
                    'requires_appointment' => true,
                    'requires_preparation' => false,
                    'preparation_instructions' => null,
                    'default_commission_percentage' => 0,
                    'status' => 'active'
                ]);

                // Migrate prices for this product
                $this->migratePrices($product->IdProducto, $service->id, $insuranceMapping, $legacyConnection);

                $this->command->info("Created service: {$service->name} (ID: {$service->id})");
                $createdCount++;

            } catch (\Exception $e) {
                $this->command->error("Error processing product {$product->IdProducto}: {$e->getMessage()}");
                $skippedCount++;
            }
        }

        $this->command->info("Migration completed:");
        $this->command->info("- Created: {$createdCount}");
        $this->command->info("- Skipped: {$skippedCount}");
    }

    /**
     * Migrate prices for a product
     */
    private function migratePrices($legacyProductId, $serviceId, $insuranceMapping, $legacyConnection): void
    {
        $legacyPrices = $legacyConnection->table('producto_precios')
            ->where('idproducto', $legacyProductId)
            ->where('activo', 'SI')
            ->where('eliminado', 'NO')
            ->get();

        foreach ($legacyPrices as $price) {
            try {
                // Map insurance type
                $insuranceTypeId = $insuranceMapping[$price->idseguro] ?? null;

                if (!$insuranceTypeId) {
                    $this->command->warn("Insurance type ID {$price->idseguro} not found for product {$legacyProductId}");
                    continue;
                }

                // Check if price already exists
                $existingPrice = ServicePrice::where('service_id', $serviceId)
                    ->where('insurance_type_id', $insuranceTypeId)
                    ->first();

                if ($existingPrice) {
                    continue;
                }

                // Create price
                ServicePrice::create([
                    'service_id' => $serviceId,
                    'insurance_type_id' => $insuranceTypeId,
                    'price' => (float) $price->PrecioVenta,
                    'effective_from' => Carbon::now()->startOfDay(),
                    'effective_until' => null,
                    'created_by' => null,
                    'notes' => "Migrated from legacy product {$legacyProductId}"
                ]);

            } catch (\Exception $e) {
                $this->command->error("Error creating price for service {$serviceId}: {$e->getMessage()}");
            }
        }
    }

    /**
     * Build mapping between legacy insurance IDs and aranto insurance types
     */
    private function buildInsuranceMapping(): array
    {
        // Get all insurance types from aranto
        $insuranceTypes = InsuranceType::pluck('id', 'name')->toArray();

        return [
            1 => $insuranceTypes['Particular'] ?? 1, // Particular
            2 => $insuranceTypes['UNIMED'] ?? null,
            3 => $insuranceTypes['MAPFRE'] ?? null,
            4 => $insuranceTypes['SEGUROS MONTERREY'] ?? null,
            5 => $insuranceTypes['SEGUROS MONTERREY'] ?? null,
            6 => $insuranceTypes['SEGUROS MONTERREY'] ?? null,
            7 => $insuranceTypes['SEGUROS MONTERREY'] ?? null,
            8 => $insuranceTypes['SEGUROS MONTERREY'] ?? null,
            9 => $insuranceTypes['SEGUROS MONTERREY'] ?? null,
            10 => $insuranceTypes['Admisionales'] ?? null,
            11 => $insuranceTypes['UNIMED'] ?? null,
        ];
    }

    /**
     * Generate a code from service name
     */
    private function generateCode(string $name): string
    {
        // Generate code from first letters of words
        $words = explode(' ', $name);
        $code = '';
        
        foreach ($words as $word) {
            if (strlen($code) < 10) {
                $code .= strtoupper(substr($word, 0, 1));
            }
        }

        return $code ?: 'SRV';
    }
}
