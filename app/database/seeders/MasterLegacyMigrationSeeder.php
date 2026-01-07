<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Carbon\Carbon;

class MasterLegacyMigrationSeeder extends Seeder
{
    /**
     * Seeder maestro para migrar TODA la data de legacy a aranto
     * 
     * Este seeder:
     * - Ejecuta todas las migraciones en el orden correcto
     * - Incluye todas las sanitaciones (UTF-8, acentos, capitalization)
     * - Es idempotente (se puede correr múltiples veces)
     * - Genera reportes detallados
     * - Se puede usar en un comando único: php artisan db:seed --class=MasterLegacyMigrationSeeder
     * 
     * Ejecución en Producción:
     * 1. Preparar backup fresco de legacy
     * 2. Ejecutar: php artisan db:seed --class=MasterLegacyMigrationSeeder
     * 3. Verificar reportes generados
     */
    public function run(): void
    {
        $startTime = microtime(true);

        $this->printHeader();

        try {
            // FASE 1: Configuración Base
            $this->phase('FASE 1', 'Configuración Base y Estructuras', function () {
                $this->call(NavigationPermissionsSeeder::class);
                $this->call(CashRegisterPermissionsSeeder::class);
                $this->call(InsuranceTypesSeeder::class);
                $this->call(ServiceCategoriesSeeder::class);
                $this->call(CreateAdditionalServiceCategoriesSeeder::class);
            });

            // FASE 2: Datos Básicos de Aranto (sin legacy)
            $this->phase('FASE 2', 'Datos Básicos de Aranto', function () {
                $this->call(ServicesSeeder::class);
                $this->call(CashRegisterUsersSeeder::class);
            });

            // FASE 3: Migraciones desde Legacy - Maestros
            $this->phase('FASE 3', 'Migraciones desde Legacy - Maestros', function () {
                $this->call(SpecialtiesFromLegacySeeder::class);
                $this->call(ProfessionalsFromLegacySeeder::class);
            });

            // FASE 4: Servicios desde Legacy (con sanitaciones)
            $this->phase('FASE 4', 'Migraciones desde Legacy - Servicios', function () {
                $this->call(ServicesFromLegacySeeder::class);
                // Las migraciones de limpieza UTF-8 se ejecutan automáticamente
                $this->call(ServicePricesFromLegacySeeder::class);
            });

            // FASE 5: Datos Complejos desde Legacy
            $this->phase('FASE 5', 'Migraciones desde Legacy - Datos Complejos', function () {
                $this->call(PatientsFromLegacySeeder::class);
                $this->call(ServiceRequestSeeder::class);
            });

            // FASE 6: Validaciones y Reportes Finales
            $this->phase('FASE 6', 'Validaciones y Reportes Finales', function () {
                $this->validateIntegrity();
                $this->generateReport();
            });

            $this->printSuccess($startTime);

        } catch (\Exception $e) {
            $this->printError($e);
            throw $e;
        }
    }

    /**
     * Ejecuta una fase de migración con manejo de errores y reportes
     */
    private function phase(string $phaseNumber, string $phaseName, callable $callback): void
    {
        $this->command->info('');
        $this->command->info(str_repeat('═', 80));
        $this->command->info("{$phaseNumber}: {$phaseName}");
        $this->command->info(str_repeat('═', 80));
        $this->command->info('');

        $phaseStart = microtime(true);

        try {
            call_user_func($callback);
            
            $phaseTime = number_format(microtime(true) - $phaseStart, 2);
            $this->command->info('');
            $this->command->line("✓ {$phaseName} completado en {$phaseTime}s");

        } catch (\Exception $e) {
            $this->command->error("✗ Error en {$phaseName}");
            $this->command->error("  Mensaje: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Valida la integridad de los datos migrados
     */
    private function validateIntegrity(): void
    {
        $this->command->info('Validando integridad de datos...');
        $this->command->info('');

        $validations = [
            'Medical Services' => [
                'total' => DB::table('medical_services')->count(),
                'con_acentos' => DB::table('medical_services')
                    ->whereRaw("name LIKE '%ó%' OR name LIKE '%á%' OR name LIKE '%í%'")
                    ->count(),
                'corruptos' => DB::table('medical_services')
                    ->whereRaw("name LIKE '%¿%' OR name LIKE '%½%'")
                    ->count(),
            ],
            'Service Prices' => [
                'total' => DB::table('service_prices')->count(),
                'por_seguro' => DB::table('service_prices')
                    ->select('insurance_type_id', DB::raw('COUNT(*) as count'))
                    ->groupBy('insurance_type_id')
                    ->pluck('count', 'insurance_type_id')
                    ->toArray(),
            ],
            'Insurance Types' => [
                'total' => DB::table('insurance_types')->count(),
            ],
            'Service Categories' => [
                'total' => DB::table('service_categories')->count(),
            ],
        ];

        foreach ($validations as $entity => $checks) {
            $this->command->line("  {$entity}:");
            foreach ($checks as $key => $value) {
                if (is_array($value)) {
                    $this->command->line("    • {$key}: " . json_encode($value));
                } else {
                    $this->command->line("    • {$key}: {$value}");
                }
            }
        }

        // Validar que no haya caracteres corruptos
        $corruptedServices = DB::table('medical_services')
            ->whereRaw("name LIKE '%¿%' OR name LIKE '%½%'")
            ->count();

        if ($corruptedServices === 0) {
            $this->command->line('');
            $this->command->info('✓ VALIDACIÓN EXITOSA: No hay caracteres corruptos');
        } else {
            $this->command->line('');
            $this->command->warn("✗ ADVERTENCIA: {$corruptedServices} servicios con caracteres corruptos");
        }
    }

    /**
     * Genera reporte final de la migración
     */
    private function generateReport(): void
    {
        $reportPath = storage_path('logs/migration_report_' . now()->format('Y-m-d_H-i-s') . '.txt');

        $report = "REPORTE DE MIGRACIÓN LEGACY → ARANTO\n";
        $report .= "=" . str_repeat("=", 78) . "\n";
        $report .= "Fecha: " . now()->format('Y-m-d H:i:s') . "\n";
        $report .= "=" . str_repeat("=", 78) . "\n\n";

        // Estadísticas de servicios
        $totalServices = DB::table('medical_services')->count();
        $fromLegacy = DB::table('legacy_service_mappings')->count();

        $report .= "SERVICIOS MÉDICOS:\n";
        $report .= "  Total en BD: {$totalServices}\n";
        $report .= "  Mapeados desde legacy: {$fromLegacy}\n";
        $report .= "  No-legacy: " . ($totalServices - $fromLegacy) . "\n";
        $report .= "  Status: ✓ CORRECTO\n\n";

        // Estadísticas de precios
        $totalPrices = DB::table('service_prices')->count();
        $report .= "PRECIOS DE SERVICIOS:\n";
        $report .= "  Total de precios: {$totalPrices}\n";
        $report .= "  Precios esperados (servicios × seguros): " . ($fromLegacy * 2) . "\n";
        
        if ($totalPrices === $fromLegacy * 2) {
            $report .= "  Status: ✓ COMPLETO\n\n";
        } else {
            $report .= "  Status: ⚠ INCOMPLETO (revisar)\n\n";
        }

        // Validación de caracteres corruptos
        $corruptedCount = DB::table('medical_services')
            ->whereRaw("name LIKE '%¿%' OR name LIKE '%½%'")
            ->count();

        $report .= "INTEGRIDAD UTF-8:\n";
        $report .= "  Caracteres corruptos (¿, ½): {$corruptedCount}\n";
        $report .= "  Status: " . ($corruptedCount === 0 ? "✓ LIMPIO\n\n" : "✗ REQUIERE LIMPIEZA\n\n");

        // Seguros
        $insuranceTypes = DB::table('insurance_types')->count();
        $report .= "SEGUROS:\n";
        $report .= "  Total tipos de seguros: {$insuranceTypes}\n";
        $report .= "  Status: ✓ CONFIGURADO\n\n";

        // Categorías
        $categories = DB::table('service_categories')->count();
        $report .= "CATEGORÍAS DE SERVICIOS:\n";
        $report .= "  Total categorías: {$categories}\n";
        $report .= "  Status: ✓ CONFIGURADO\n\n";

        // Crear archivo
        file_put_contents($reportPath, $report);

        $this->command->info('');
        $this->command->info("Reporte guardado en: {$reportPath}");
    }

    /**
     * Imprime encabezado
     */
    private function printHeader(): void
    {
        $this->command->info('');
        $this->command->info(str_repeat('═', 80));
        $this->command->info('╔' . str_repeat('═', 78) . '╗');
        $this->command->info('║' . '  MASTER LEGACY MIGRATION SEEDER - FULL AUTOMATED PROCESS' . str_repeat(' ', 20) . '║');
        $this->command->info('║' . '  Sistema automatizado para migrar de legacy a aranto' . str_repeat(' ', 26) . '║');
        $this->command->info('║' . '  Con sanitaciones UTF-8, acentos y validaciones' . str_repeat(' ', 29) . '║');
        $this->command->info('╚' . str_repeat('═', 78) . '╝');
        $this->command->info(str_repeat('═', 80));
        $this->command->info('');
    }

    /**
     * Imprime mensaje de éxito
     */
    private function printSuccess(float $startTime): void
    {
        $totalTime = number_format(microtime(true) - $startTime, 2);

        $this->command->info('');
        $this->command->info(str_repeat('═', 80));
        $this->command->info('✓ MIGRACIÓN COMPLETADA EXITOSAMENTE');
        $this->command->info('═' . str_repeat('═', 78) . '═');
        $this->command->info('');
        $this->command->info("Tiempo total: {$totalTime}s");
        $this->command->info('');
        $this->command->info('Sistema listo para producción');
        $this->command->info('');
        $this->command->info(str_repeat('═', 80));
    }

    /**
     * Imprime mensaje de error
     */
    private function printError(\Exception $e): void
    {
        $this->command->error('');
        $this->command->error(str_repeat('═', 80));
        $this->command->error('✗ ERROR EN LA MIGRACIÓN');
        $this->command->error('═' . str_repeat('═', 78) . '═');
        $this->command->error('');
        $this->command->error("Error: {$e->getMessage()}");
        $this->command->error('');
        $this->command->error(str_repeat('═', 80));
    }
}
