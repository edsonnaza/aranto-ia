<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class MigrateLegacyData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'legacy:migrate {--force : Skip confirmation} {--report : Generate detailed report}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Migrate all data from legacy database with sanitizations and validations (AUTOMATED)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->printBanner();

        // Verificar que legacy está disponible
        if (!$this->checkLegacyConnection()) {
            $this->error('✗ No se puede conectar a legacy database');
            return 1;
        }

        // Pedir confirmación
        if (!$this->option('force')) {
            if (!$this->confirm('¿Ejecutar migración COMPLETA desde legacy? (incluye sanitaciones y validaciones)')) {
                $this->line('Migración cancelada');
                return 0;
            }
        }

        // Ejecutar migración
        try {
            $this->info('');
            $this->info('Iniciando migración completa automatizada...');
            $this->info('');

            // Paso 1: Limpiar BD completamente (migrate:fresh sin seeders)
            $this->line('');
            $this->line('📋 Paso 1: Limpiando base de datos y ejecutando migraciones...');
            $this->call('migrate:fresh', [
                '--force' => true,
            ]);
            $this->line('✅ Base de datos limpia y lista');

            $startTime = microtime(true);

            // Paso 2: Ejecutar el seeder maestro
            $this->line('');
            $this->line('📋 Paso 2: Ejecutando migraciones legacy...');
            $this->call('db:seed', [
                '--class' => 'MasterLegacyMigrationSeeder',
            ]);

            $duration = number_format(microtime(true) - $startTime, 2);

            $this->printSuccess($duration);

            // Generar reporte si se solicita
            if ($this->option('report')) {
                $this->generateDetailedReport();
            }

            return 0;

        } catch (\Exception $e) {
            $this->error('✗ Error durante la migración:');
            $this->error($e->getMessage());
            return 1;
        }
    }

    /**
     * Verificar conexión a legacy
     */
    private function checkLegacyConnection(): bool
    {
        try {
            DB::connection('legacy')->getPdo();
            $this->line('✓ Conexión a legacy verificada');
            
            // Contar productos
            $count = DB::connection('legacy')
                ->table('producto')
                ->count();
            
            $this->line("  Productos disponibles: {$count}");
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Generar reporte detallado
     */
    private function generateDetailedReport(): void
    {
        $this->info('');
        $this->info('Generando reporte detallado...');

        $report = "REPORTE DETALLADO DE MIGRACIÓN LEGACY → ARANTO\n";
        $report .= str_repeat('=', 80) . "\n";
        $report .= "Fecha: " . now()->format('Y-m-d H:i:s') . "\n\n";

        // Datos de servicios
        $totalServices = DB::table('services')->count();
        $servicesFromLegacy = DB::table('legacy_service_mappings')->count();
        $withAccents = DB::table('services')
            ->whereRaw("name LIKE '%ó%' OR name LIKE '%á%' OR name LIKE '%í%'")
            ->count();
        $corrupted = DB::table('services')
            ->whereRaw("name LIKE '%¿%' OR name LIKE '%½%'")
            ->count();

        $report .= "SERVICIOS:\n";
        $report .= "  Total: {$totalServices}\n";
        $report .= "  Desde legacy: {$servicesFromLegacy}\n";
        $report .= "  Con acentos válidos: {$withAccents}\n";
        $report .= "  Caracteres corruptos: {$corrupted}\n";
        $report .= "  Estado: " . ($corrupted === 0 ? "✓ LIMPIO\n" : "✗ REQUIERE LIMPIEZA\n");
        $report .= "\n";

        // Precios
        $totalPrices = DB::table('service_prices')->count();
        $pricesByInsurance = DB::table('service_prices')
            ->select('insurance_type_id', DB::raw('COUNT(*) as count'))
            ->groupBy('insurance_type_id')
            ->get();

        $report .= "PRECIOS DE SERVICIOS:\n";
        $report .= "  Total: {$totalPrices}\n";
        foreach ($pricesByInsurance as $price) {
            $insurance = DB::table('insurance_types')->find($price->insurance_type_id);
            $report .= "    • " . ($insurance->name ?? 'Unknown') . ": {$price->count}\n";
        }
        $report .= "\n";

        // Especialidades
        $specialties = DB::table('specialties')->count();
        $report .= "ESPECIALIDADES: {$specialties}\n\n";

        // Profesionales
        $professionals = DB::table('professionals')->count();
        $report .= "PROFESIONALES: {$professionals}\n\n";

        // Pacientes
        $patients = DB::table('patients')->count();
        $report .= "PACIENTES: {$patients}\n\n";

        // Seguros
        $insurances = DB::table('insurance_types')->count();
        $report .= "TIPOS DE SEGUROS: {$insurances}\n\n";

        // Categorías
        $categories = DB::table('service_categories')->count();
        $report .= "CATEGORÍAS DE SERVICIOS: {$categories}\n\n";

        $reportPath = storage_path('logs/detailed_report_' . now()->format('Y-m-d_H-i-s') . '.txt');
        file_put_contents($reportPath, $report);

        $this->info("✓ Reporte guardado en: {$reportPath}");
    }

    /**
     * Imprimir banner
     */
    private function printBanner(): void
    {
        $this->line('');
        $this->line(str_repeat('═', 80));
        $this->line('╔' . str_repeat('═', 78) . '╗');
        $this->line('║' . '  LEGACY → ARANTO MIGRATION TOOL' . str_repeat(' ', 46) . '║');
        $this->line('║' . '  Automated full migration with sanitizations' . str_repeat(' ', 32) . '║');
        $this->line('╚' . str_repeat('═', 78) . '╝');
        $this->line(str_repeat('═', 80));
        $this->line('');
    }

    /**
     * Imprimir éxito
     */
    private function printSuccess(string $duration): void
    {
        $this->line('');
        $this->line(str_repeat('═', 80));
        $this->info('✓ MIGRACIÓN COMPLETADA EXITOSAMENTE');
        $this->line(str_repeat('═', 80));
        $this->line('');
        $this->line("Tiempo total: {$duration}s");
        $this->line('');
        $this->info('Sistema listo para producción');
        $this->line('');
        $this->line(str_repeat('═', 80));
    }
}

