<?php

namespace App\Console\Commands;

use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class SetupAllDatabase extends Command
{
    protected $signature = 'setup:all-database {--backup-path= : Ruta al archivo db_legacy_infomed.sql}';
    protected $description = 'Setup all databases: legacy, production, and testing';

    public function handle()
    {
        $this->info('=== CONFIGURACION COMPLETA DE BASES DE DATOS ===');
        $this->newLine();

        $this->info('PASO 1: Importando base de datos legacy desde backup...');
        $skipLegacy = !$this->importLegacyDatabase();
        if ($skipLegacy) {
            $this->warn('Saltando PASO 1 - Continuando con los demás pasos');
        }
        $this->newLine();

        $this->info('PASO 2: Ejecutando legacy:migrate...');
        if (!$skipLegacy && !$this->call('legacy:migrate', ['--force' => true])) {
            $this->error('Error al ejecutar legacy:migrate');
            return 1;
        }
        $this->newLine();

        $this->info('PASO 3: Copiando datos de aranto_medical a testing...');
        if (!$this->copyToTestingDatabase()) {
            $this->error('Error al copiar datos a testing');
            return 1;
        }
        $this->newLine();

        $this->info('PASO 4: Ejecutando migraciones en testing...');
        if (!$this->migrateTestingDatabase()) {
            $this->error('Error al migrar testing');
            return 1;
        }
        $this->newLine();

        $this->info('=== COMPLETADO EXITOSAMENTE ===');
        $this->newLine();
        if (!$skipLegacy) {
            $this->line('  - db_legacy_infomed     : Importada');
        }
        $this->line('  - aranto_medical        : Migrada');
        $this->line('  - aranto_medical_testing: Lista');
        $this->newLine();

        return 0;
    }

    private function importLegacyDatabase(): bool
    {
        try {
            $customPath = $this->option('backup-path');
            
            if (!$customPath) {
                $customPath = '/Users/edsonnaza/Desktop/db_legacy_infomed.sql';
            }

            $this->line("Buscando archivo: $customPath");

            // Intentar localizar el archivo en varias ubicaciones
            $possiblePaths = [
                $customPath,
                $_SERVER['HOME'] . '/Desktop/db_legacy_infomed.sql',
                '/tmp/db_legacy_infomed.sql',
                dirname(dirname(dirname(__DIR__))) . '/db_legacy_infomed.sql',
            ];

            $actualPath = null;
            foreach ($possiblePaths as $path) {
                if (file_exists($path)) {
                    $actualPath = $path;
                    $this->line("✓ Archivo encontrado en: $actualPath");
                    break;
                }
            }

            if (!$actualPath) {
                $this->warn("Archivo no encontrado en las siguientes ubicaciones:");
                foreach ($possiblePaths as $path) {
                    $this->line("  - $path");
                }
                $this->line('Saltando importación legacy');
                return false;
            }

            $fileSize = filesize($actualPath);
            $this->line("Tamaño del archivo: " . number_format($fileSize / (1024 * 1024), 2) . " MB");
            
            $this->line('Copiando archivo al contenedor MySQL...');
            
            // Obtener el nombre del contenedor MySQL
            $process = new Process(['docker', 'compose', 'ps', 'mysql', '-q']);
            $process->setWorkingDirectory(dirname(dirname(dirname(__DIR__))));
            $process->run();
            $mysqlContainer = trim($process->getOutput());

            if (empty($mysqlContainer)) {
                $this->error('Contenedor MySQL no está corriendo');
                return false;
            }

            $this->line("Contenedor MySQL: $mysqlContainer");

            // Copiar archivo al contenedor
            $process = new Process(['docker', 'cp', $actualPath, $mysqlContainer . ':/tmp/db_legacy_infomed.sql']);
            $process->setWorkingDirectory(dirname(dirname(dirname(__DIR__))));
            $process->setTimeout(120);
            $process->run();

            if (!$process->isSuccessful()) {
                $this->error('Error al copiar el archivo: ' . $process->getErrorOutput());
                return false;
            }

            $this->line('✓ Archivo copiado al contenedor');
            $this->line('Importando datos en base de datos legacy...');
            
            // Importar usando docker compose exec
            $cmd = 'mysql -uroot -p4r4nt0 -e "SET GLOBAL log_bin_trust_function_creators=1;" && ' .
                   'mysql -uroot -p4r4nt0 db_legacy_infomed < /tmp/db_legacy_infomed.sql && ' .
                   'mysql -uroot -p4r4nt0 -e "SET GLOBAL log_bin_trust_function_creators=0;"';

            $process = new Process(['docker', 'compose', 'exec', '-T', 'mysql', 'bash', '-c', $cmd]);
            $process->setWorkingDirectory(dirname(dirname(dirname(__DIR__))));
            $process->setTimeout(600);
            $process->run();

            if (!$process->isSuccessful()) {
                $this->error('Error al importar datos: ' . $process->getErrorOutput());
                return false;
            }

            $this->line('✓ Base de datos legacy importada correctamente');
            return true;
        } catch (Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return false;
        }
    }

    private function copyToTestingDatabase(): bool
    {
        try {
            $this->line('Copiando datos a testing...');
            
            // Crear database de testing si no existe
            DB::statement('CREATE DATABASE IF NOT EXISTS aranto_medical_testing');
            
            // Obtener todas las tablas
            $tables = DB::select("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'aranto_medical'");
            
            foreach ($tables as $table) {
                $tableName = $table->TABLE_NAME;
                
                // Eliminar tabla en testing
                DB::statement("DROP TABLE IF EXISTS `aranto_medical_testing`.`$tableName`");
                
                // Copiar estructura y datos en una sola operación
                DB::statement("CREATE TABLE `aranto_medical_testing`.`$tableName` LIKE `aranto_medical`.`$tableName`");
                DB::statement("INSERT INTO `aranto_medical_testing`.`$tableName` SELECT * FROM `aranto_medical`.`$tableName`");
                
                $this->line("  ✓ Tabla copiada: $tableName");
            }

            $this->line('Datos copiados a testing');
            return true;
        } catch (Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return false;
        }
    }

    private function migrateTestingDatabase(): bool
    {
        try {
            $this->call('migrate', [
                '--env' => 'testing',
                '--force' => true,
            ]);

            // Verificar si legacy existe ahora
            $legacyExists = DB::select("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'db_legacy_infomed'");
            
            if (!empty($legacyExists)) {
                $this->line('Ejecutando seeding con datos de legacy...');
                $this->call('db:seed', [
                    '--env' => 'testing',
                    '--class' => 'DatabaseSeeder',
                    '--force' => true,
                ]);
                $this->line('✓ Testing seeded con datos de legacy');
            } else {
                $this->warn('Seeding saltado - base de datos legacy no disponible');
            }

            $this->line('Testing migrada');
            return true;
        } catch (Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return false;
        }
    }

}
