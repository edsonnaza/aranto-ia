<?php

namespace Database\Seeders;

use App\Models\LegacyServiceMapping;
use App\Models\ServicePrice;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

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
        echo "\n=== INICIANDO MIGRACIÓN DE PRECIOS DE SERVICIOS ===\n";

        // Obtener todos los precios de productos en legacy
        // PERO solo los de productos que fueron migrados
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
        $ignorados = 0; // Contadores para productos no migrados

        echo "Total de precios en legacy: {$totalPrecios}\n";
        echo "Servicios migrados en Aranto: " . count($migratedServiceIds) . "\n";

        foreach ($legacyPrices as $precio) {
            $procesados++;

            try {
                // Validar que el producto fue migrado
                if (!in_array($precio->idproducto, $migratedServiceIds)) {
                    $ignorados++;
                    continue; // Saltar sin mostrar aviso (ya muy verbose)
                }

                // Buscar el mapeo del producto legacy
                $mapping = LegacyServiceMapping::where('legacy_product_id', $precio->idproducto)->first();

                if (!$mapping) {
                    echo "⚠️  Aviso: Producto legacy {$precio->idproducto} no tiene mapeo a Aranto (pero existe en migraciones)\n";
                    continue;
                }

                // Validar que el seguro exista en aranto
                if (!isset($this->insuranceMappings[$precio->idseguro])) {
                    echo "⚠️  Aviso: Seguro legacy {$precio->idseguro} no tiene mapeo a Aranto\n";
                    continue;
                }

                $arantoInsuranceId = $this->insuranceMappings[$precio->idseguro];

                // Verificar que la insurance_type exista en aranto
                $insuranceExists = DB::table('insurance_types')
                    ->where('id', $arantoInsuranceId)
                    ->exists();

                if (!$insuranceExists) {
                    echo "⚠️  Aviso: Insurance type {$arantoInsuranceId} no existe en Aranto\n";
                    continue;
                }

                // Crear o actualizar el precio en service_prices
                $servicePrice = ServicePrice::updateOrCreate(
                    [
                        'service_id' => $mapping->service_id,
                        'insurance_type_id' => $arantoInsuranceId,
                    ],
                    [
                        'price' => $precio->PrecioVenta,
                        'effective_from' => now(),
                        'effective_until' => null,
                    ]
                );

                $creados++;

                // Mostrar progreso cada 50 registros
                if ($procesados % 50 == 0) {
                    echo "[{$procesados}/{$totalPrecios}] Procesados: {$creados} precios creados/actualizados\n";
                }
            } catch (\Exception $e) {
                $errores++;
                echo "❌ Error procesando precio legacy ID {$precio->idproducto}: {$e->getMessage()}\n";
            }
        }

        echo "\n=== RESUMEN DE MIGRACIÓN DE PRECIOS ===\n";
        echo "Total precios en legacy: {$totalPrecios}\n";
        echo "Precios de servicios migrados: " . ($procesados - $ignorados) . "\n";
        echo "Creados/Actualizados: {$creados}\n";
        echo "Ignorados (producto no migrado): {$ignorados}\n";
        echo "Errores: {$errores}\n";

        // Mostrar estadísticas por seguro
        $pricesByInsurance = DB::table('service_prices')
            ->select('insurance_type_id', DB::raw('COUNT(*) as total'), DB::raw('MIN(price) as min'), DB::raw('MAX(price) as max'), DB::raw('AVG(price) as avg'))
            ->groupBy('insurance_type_id')
            ->get();

        echo "\n=== ESTADÍSTICAS POR SEGURO ===\n";
        foreach ($pricesByInsurance as $stat) {
            $insurance = DB::table('insurance_types')->find($stat->insurance_type_id);
            echo sprintf(
                "%s: %d precios (Min: %.0f, Max: %.0f, Promedio: %.2f)\n",
                $insurance->name ?? "ID {$stat->insurance_type_id}",
                $stat->total,
                $stat->min,
                $stat->max,
                $stat->avg
            );
        }
    }
}
