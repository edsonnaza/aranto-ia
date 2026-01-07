<?php

namespace Database\Seeders;

use App\Models\LegacyServiceMapping;
use App\Models\ServicePrice;
use App\Models\InsuranceType;
use App\Models\MedicalService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ServicePricesFromLegacySeeder extends Seeder
{
    /**
     * Mapping de IDs de seguros en legacy a IDs en aranto
     */
    private array $insuranceMappings = [
        1 => 1,    // Particular -> Particular
        2 => 2,    // Sermed -> Unimed
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

        $totalPrecios = $legacyPrices->count();
        $procesados = 0;
        $errores = 0;
        $creados = 0;
        $ignorados = 0;
        $noMapeado = 0;

        $this->command->line("Total de precios en legacy: {$totalPrecios}");
        $this->command->line("Buscando mapeos de servicios...");
        
        // Pre-cargar todos los mapeos en memoria
        $mappings = LegacyServiceMapping::pluck('service_id', 'legacy_product_id')->toArray();
        $this->command->line("Mapeos encontrados: " . count($mappings));
        $this->command->info('');

        if ($totalPrecios === 0) {
            $this->command->warn('⚠️  No hay precios activos en legacy para migrar');
            return;
        }

        foreach ($legacyPrices as $precio) {
            $procesados++;

            try {
                // Buscar el service_id usando el mapeo precargado
                if (!isset($mappings[$precio->idproducto])) {
                    $noMapeado++;
                    continue;
                }

                $serviceId = $mappings[$precio->idproducto];

                // Verificar que el servicio exista
                $service = MedicalService::find($serviceId);
                if (!$service) {
                    $this->command->warn("⚠️  Servicio {$serviceId} no existe en medical_services");
                    $errores++;
                    continue;
                }

                // Validar que el seguro tenga mapeo
                if (!isset($this->insuranceMappings[$precio->idseguro])) {
                    continue;
                }

                $arantoInsuranceId = $this->insuranceMappings[$precio->idseguro];

                // Verificar que la insurance_type exista
                $insurance = InsuranceType::find($arantoInsuranceId);
                if (!$insurance) {
                    $this->command->warn("⚠️  Insurance type {$arantoInsuranceId} no existe");
                    continue;
                }

                // Validar el precio
                $price = (float) $precio->PrecioVenta;
                if ($price <= 0) {
                    continue;
                }

                // Crear o actualizar el precio en service_prices
                $servicePrice = ServicePrice::updateOrCreate(
                    [
                        'service_id' => $serviceId,
                        'insurance_type_id' => $arantoInsuranceId,
                    ],
                    [
                        'price' => $price,
                        'effective_from' => now()->toDateString(),
                        'effective_until' => null,
                    ]
                );

                $creados++;

                // Mostrar progreso cada 100 registros
                if ($procesados % 100 == 0) {
                    $this->command->line("[{$procesados}/{$totalPrecios}] Creados: {$creados}");
                }
            } catch (\Exception $e) {
                $errores++;
                $this->command->error("❌ Error ID {$precio->idproducto}: {$e->getMessage()}");
            }
        }

        $this->command->info('');
        $this->command->info('=== RESUMEN DE MIGRACIÓN DE PRECIOS ===');
        $this->command->line("Total precios en legacy: {$totalPrecios}");
        $this->command->line("✓ Creados/Actualizados: {$creados}");
        $this->command->line("⊘ Sin mapeo de producto: {$noMapeado}");
        if ($errores > 0) {
            $this->command->warn("✗ Errores: {$errores}");
        }

        // Mostrar estadísticas finales
        $totalInDb = DB::table('service_prices')->count();
        $this->command->line("");
        $this->command->line("Total de precios en BD: {$totalInDb}");

        if ($totalInDb > 0) {
            $this->command->info("");
            $this->command->info("=== ESTADÍSTICAS POR SEGURO ===");
            $pricesByInsurance = DB::table('service_prices')
                ->select('insurance_type_id', DB::raw('COUNT(*) as total'), DB::raw('MIN(price) as min'), DB::raw('MAX(price) as max'), DB::raw('AVG(price) as avg'))
                ->groupBy('insurance_type_id')
                ->get();

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
            $this->command->warn('⚠️  No hay precios en la tabla service_prices después de la migración');
        }

        $this->command->info('');
    }
}
