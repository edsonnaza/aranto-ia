<?php

namespace Database\Seeders;

use App\Models\LegacyServiceMapping;
use App\Models\ServicePrice;
use App\Models\InsuranceType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ServicePricesFromLegacySeeder extends Seeder
{
    /**
     * Mapping de IDs de seguros en legacy a IDs en aranto
     * Legacy usa id, Aranto también usa id en insurance_types
     */
    private array $insuranceMappings = [
        1 => 1,    // Particular -> Particular
        2 => 2,    // Sermed -> Unimed (similar)
        3 => 3,    // SPS -> OSDE Py
        4 => 4,    // Migone -> Swiss Medical
        5 => 10,   // Asismed -> ASSE
        11 => 11,  // Mutualista -> Mutualista
    ];

    public function run(): void
    {
        $this->command->info('');
        $this->command->info('=== INICIANDO MIGRACIÓN DE PRECIOS DE SERVICIOS ===');
        $this->command->info('');

        // Obtener todos los precios de productos en legacy
        $legacyPrices = DB::connection('legacy')
            ->table('producto_precios')
            ->where('activo', 'SI')
            ->where('eliminado', 'NO')
            ->get();

        // Obtener IDs de servicios migrados desde legacy_service_mappings
        $migratedServiceIds = LegacyServiceMapping::pluck('legacy_product_id')->toArray();

        $totalPrecios = $legacyPrices->count();
        $procesados = 0;
        $errores = 0;
        $creados = 0;
        $ignorados = 0;

        $this->command->line("Total de precios en legacy: {$totalPrecios}");
        $this->command->line("Servicios migrados en Aranto: " . count($migratedServiceIds));
        $this->command->info('');

        if ($totalPrecios === 0) {
            $this->command->warn('⚠️  No hay precios activos en legacy para migrar');
            return;
        }

        foreach ($legacyPrices as $precio) {
            $procesados++;

            try {
                // Validar que el producto fue migrado
                if (!in_array($precio->idproducto, $migratedServiceIds)) {
                    $ignorados++;
                    continue;
                }

                // Buscar el mapeo del producto legacy
                $mapping = LegacyServiceMapping::where('legacy_product_id', $precio->idproducto)->first();

                if (!$mapping) {
                    $this->command->warn("⚠️  Producto legacy {$precio->idproducto} no tiene mapeo");
                    continue;
                }

                // Validar que el seguro exista en aranto
                if (!isset($this->insuranceMappings[$precio->idseguro])) {
                    $this->command->warn("⚠️  Seguro legacy {$precio->idseguro} no tiene mapeo a Aranto");
                    continue;
                }

                $arantoInsuranceId = $this->insuranceMappings[$precio->idseguro];

                // Verificar que la insurance_type exista en aranto
                $insurance = InsuranceType::find($arantoInsuranceId);
                if (!$insurance) {
                    $this->command->warn("⚠️  Insurance type {$arantoInsuranceId} no existe en Aranto");
                    continue;
                }

                // Validar el precio
                $price = (float) $precio->PrecioVenta;
                if ($price <= 0) {
                    $this->command->warn("⚠️  Precio inválido para producto {$precio->idproducto}: {$price}");
                    continue;
                }

                // Crear o actualizar el precio en service_prices
                $servicePrice = ServicePrice::updateOrCreate(
                    [
                        'service_id' => $mapping->service_id,
                        'insurance_type_id' => $arantoInsuranceId,
                    ],
                    [
                        'price' => $price,
                        'effective_from' => now()->toDateString(),
                        'effective_until' => null,
                    ]
                );

                $creados++;

                // Mostrar progreso cada 50 registros
                if ($procesados % 50 == 0) {
                    $this->command->line("[{$procesados}/{$totalPrecios}] Procesados: {$creados} precios creados/actualizados");
                }
            } catch (\Exception $e) {
                $errores++;
                $this->command->error("❌ Error procesando precio legacy ID {$precio->idproducto}: {$e->getMessage()}");
            }
        }

        $this->command->info('');
        $this->command->info('=== RESUMEN DE MIGRACIÓN DE PRECIOS ===');
        $this->command->line("Total precios en legacy: {$totalPrecios}");
        $this->command->line("Precios de servicios migrados: " . ($procesados - $ignorados));
        $this->command->line("✓ Creados/Actualizados: {$creados}");
        $this->command->line("⊘ Ignorados (producto no migrado): {$ignorados}");
        if ($errores > 0) {
            $this->command->warn("✗ Errores: {$errores}");
        }

        // Mostrar estadísticas por seguro
        $pricesByInsurance = DB::table('service_prices')
            ->select('insurance_type_id', DB::raw('COUNT(*) as total'), DB::raw('MIN(price) as min'), DB::raw('MAX(price) as max'), DB::raw('AVG(price) as avg'))
            ->groupBy('insurance_type_id')
            ->get();

        if ($pricesByInsurance->count() > 0) {
            $this->command->info('');
            $this->command->info('=== ESTADÍSTICAS POR SEGURO ===');
            foreach ($pricesByInsurance as $stat) {
                $insurance = InsuranceType::find($stat->insurance_type_id);
                $this->command->line(sprintf(
                    "%s: %d precios (Min: ₲%.0f, Max: ₲%.0f, Promedio: ₲%.2f)",
                    $insurance->name ?? "ID {$stat->insurance_type_id}",
                    $stat->total,
                    $stat->min,
                    $stat->max,
                    $stat->avg
                ));
            }
        } else {
            $this->command->warn('⚠️  No hay precios en la tabla service_prices');
        }

        $this->command->info('');
    }
}
