<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MigrateProductosFromLegacySeeder extends Seeder
{
    /**
     * Migra productos (servicios médicos) desde legacy
     * 
     * Estructura:
     * - producto (legacy) → medical_services (aranto)
     * - Preserva IdCategoria en tabla pivot service_service_category
     * - producto_precios → medical_service_prices (con mapeo de seguros)
     */
    public function run(): void
    {
        echo "\n📦 MIGRACIÓN DE PRODUCTOS DESDE LEGACY\n";
        echo str_repeat('─', 80) . "\n\n";

        try {
            // PASO 1: Obtener todos los productos de legacy
            echo "1️⃣  Obteniendo productos de legacy...\n";
            $productos = DB::connection('legacy')
                ->table('producto')
                ->where('Estado', 'ACTIVO')
                ->get();

            echo "   ✓ {$productos->count()} productos encontrados\n\n";

            // PASO 2: Migrar productos a medical_services
            echo "2️⃣  Migrando productos a medical_services...\n";
            
            $serviciosMigrados = 0;
            $serviciosConError = 0;

            foreach ($productos as $producto) {
                try {
                    // Crear el servicio médico
                    $servicioId = DB::table('medical_services')->insertGetId([
                        'name' => $producto->Nombre,
                        'code' => $producto->Codigo ?? $producto->IdProducto,
                        'description' => $producto->Descripcion,
                        'category_id' => $producto->IdCategoria, // Preservar la categoría
                        'cost_price' => $producto->PrecioCosto ?? 0,
                        'sale_price' => $producto->PrecioVenta ?? 0,
                        'status' => 'active',
                        'legacy_id' => $producto->IdProducto, // Mapeo para auditoría
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // PASO 3: Insertar en tabla pivot (relación con categoría)
                    DB::table('service_service_category')->insert([
                        'service_id' => $servicioId,
                        'service_category_id' => $producto->IdCategoria,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $serviciosMigrados++;

                } catch (\Exception $e) {
                    $serviciosConError++;
                    \Log::warning("Error migrando producto {$producto->IdProducto}: " . $e->getMessage());
                }
            }

            echo "   ✓ {$serviciosMigrados} servicios creados\n";
            if ($serviciosConError > 0) {
                echo "   ⚠️  {$serviciosConError} errores\n";
            }
            echo "\n";

            // PASO 4: Migrar precios (producto_precios)
            echo "3️⃣  Migrando precios de productos...\n";
            
            $precios = DB::connection('legacy')
                ->table('producto_precios')
                ->where('eliminado', 'NO')
                ->get();

            echo "   ✓ {$precios->count()} registros de precio encontrados\n\n";

            $preciosMigrados = 0;
            $preciosConError = 0;

            foreach ($precios as $precio) {
                try {
                    // Obtener el ID del servicio creado (usando legacy_id)
                    $servicio = DB::table('medical_services')
                        ->where('legacy_id', $precio->idproducto)
                        ->first();

                    if (!$servicio) {
                        throw new \Exception("Servicio no encontrado para producto {$precio->idproducto}");
                    }

                    // Obtener o crear el insurance_type (mapeo de seguros)
                    $insuranceType = DB::table('insurance_types')
                        ->where('legacy_id', $precio->idseguro)
                        ->orWhere('name', $precio->seguro_nombre)
                        ->first();

                    if (!$insuranceType) {
                        // Crear el tipo de seguro si no existe
                        $insuranceTypeId = DB::table('insurance_types')->insertGetId([
                            'name' => $precio->seguro_nombre ?? 'Desconocido',
                            'legacy_id' => $precio->idseguro,
                            'status' => 'active',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        $insuranceTypeId = $insuranceType->id;
                    }

                    // Insertar precio
                    DB::table('medical_service_prices')->insert([
                        'medical_service_id' => $servicio->id,
                        'insurance_type_id' => $insuranceTypeId,
                        'price' => $precio->PrecioVenta,
                        'active' => $precio->activo === 'SI' ? true : false,
                        'legacy_price_id' => $precio->id, // Mapeo para auditoría
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $preciosMigrados++;

                } catch (\Exception $e) {
                    $preciosConError++;
                    \Log::warning("Error migrando precio {$precio->id}: " . $e->getMessage());
                }
            }

            echo "   ✓ {$preciosMigrados} precios creados\n";
            if ($preciosConError > 0) {
                echo "   ⚠️  {$preciosConError} errores\n";
            }
            echo "\n";

            // RESUMEN FINAL
            echo str_repeat('─', 80) . "\n";
            echo "✅ MIGRACIÓN COMPLETADA\n";
            echo str_repeat('─', 80) . "\n";
            echo "Servicios migrados: {$serviciosMigrados}\n";
            echo "Precios migrados: {$preciosMigrados}\n";
            echo "\n";

        } catch (\Exception $e) {
            echo "❌ Error general en la migración: " . $e->getMessage() . "\n";
            throw $e;
        }
    }
}
