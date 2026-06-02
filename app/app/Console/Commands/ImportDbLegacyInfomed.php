<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class ImportDbLegacyInfomed extends Command
{
    protected $signature = 'import:db_legacy_infomed {--backup-path= : Ruta al archivo db_legacy_infomed.sql}';
    protected $description = 'Importa la base de datos legacy desde un archivo SQL';

    public function handle()
    {
        $this->info('═══════════════════════════════════════════════════════════');
        $this->info('    IMPORTADOR DE BASE DE DATOS LEGACY');
        $this->info('═══════════════════════════════════════════════════════════');
        $this->newLine();

        // Obtener la ruta del archivo (relativa al proyecto o absoluta)
        $projectRoot = base_path();
        $projectDir = dirname($projectRoot);
        
        // Si se especifica --backup-path, resolverlo relativo a projectDir (donde está docker-compose.yml)
        if ($this->option('backup-path')) {
            $backupFile = $this->option('backup-path');
            // Si es ruta relativa, hacerla relativa a projectDir
            if (!str_starts_with($backupFile, '/')) {
                $backupFile = $projectDir . '/' . $backupFile;
            }
        } else {
            // Intentar encontrar en Desktop del usuario
            $homeDir = getenv('HOME') ?: expanduser('~');
            $backupFile = $homeDir . '/Desktop/db_legacy_infomed.sql';
            
            // Si no existe en Desktop, intentar en la raíz del proyecto
            if (!file_exists($backupFile)) {
                $backupFile = $projectRoot . '/db_legacy_infomed.sql';
            }
        }
        
        // Verificar que el archivo existe
        if (!file_exists($backupFile)) {
            $this->error('✗ Error: Archivo no encontrado');
            $this->newLine();
            $this->line('Se buscó en:');
            $this->line("  • {$homeDir}/Desktop/db_legacy_infomed.sql");
            $this->line("  • {$projectRoot}/db_legacy_infomed.sql");
            $this->newLine();
            $this->line('Soluciones:');
            $this->line('  1. Copiar archivo a Desktop:');
            $this->line("     cp /ruta/al/db_legacy_infomed.sql {$homeDir}/Desktop/");
            $this->newLine();
            $this->line('  2. Copiar archivo a raíz del proyecto:');
            $this->line("     cp /ruta/al/db_legacy_infomed.sql {$projectRoot}/");
            $this->newLine();
            $this->line('  3. O usar opción --backup-path (ruta relativa o absoluta):');
            $this->line('     php artisan import:db_legacy_infomed --backup-path=../db_legacy_infomed.sql');
            $this->line('     php artisan import:db_legacy_infomed --backup-path=/ruta/absoluta/db_legacy_infomed.sql');
            $this->newLine();
            $this->line('<fg=yellow>⚠ IMPORTANTE:</> Ejecuta este comando desde el HOST, no desde dentro del contenedor:');
            $this->line('  ✗ NO: docker compose exec app php artisan import:db_legacy_infomed');
            $this->line('  ✓ SÍ: php artisan import:db_legacy_infomed');
            return 1;
        }

        $fileSize = filesize($backupFile);
        $fileSizeHuman = $this->formatBytes($fileSize);
        
        $this->line("<fg=green>✓ Archivo encontrado:</> {$backupFile}");
        $this->line("<fg=green>✓ Tamaño:</> {$fileSizeHuman}");
        $this->newLine();

        // Obtener el directorio del proyecto
        $projectDir = base_path('../');
        $this->line("<fg=blue>Directorio de trabajo:</> {$projectDir}");
        $this->newLine();

        // Verificar Docker Compose
        $this->line('<fg=yellow>Verificando Docker Compose...</>');
        $process = new Process(['docker', 'compose', 'ps', 'mysql', '-q']);
        $process->setWorkingDirectory($projectDir);
        $process->run();

        if (!$process->isSuccessful()) {
            $this->error('✗ Error: Docker Compose no está corriendo');
            $this->line('Inicia Docker Compose con: docker compose up -d');
            return 1;
        }

        $mysqlContainer = trim($process->getOutput());
        if (empty($mysqlContainer)) {
            $this->error('✗ Error: Contenedor MySQL no está corriendo');
            return 1;
        }

        $this->line("<fg=green>✓ Docker Compose está corriendo</>");
        $this->line("<fg=green>✓ Contenedor MySQL:</> {$mysqlContainer}");
        $this->newLine();

        // PASO 1: Copiar archivo al contenedor
        $this->line('<fg=yellow>Copiando archivo al contenedor MySQL...</>');
        $process = new Process(['docker', 'cp', $backupFile, $mysqlContainer . ':/tmp/db_legacy_infomed.sql']);
        $process->setWorkingDirectory($projectDir);
        $process->setTimeout(120);
        $process->run();

        if (!$process->isSuccessful()) {
            $this->error('✗ Error al copiar archivo');
            $this->error($process->getErrorOutput());
            return 1;
        }

        $this->line('<fg=green>✓ Archivo copiado exitosamente</>');
        $this->newLine();

        // PASO 2: Importar archivo
        $this->line('<fg=yellow>Importando base de datos legacy...</>');
        $this->line('  Esta operación puede tomar varios minutos dependiendo del tamaño del archivo...');
        $this->newLine();

        $cmd = 'mysql -uroot -p4r4nt0 -e "SET GLOBAL log_bin_trust_function_creators=1;" && ' .
               'mysql -uroot -p4r4nt0 db_legacy_infomed < /tmp/db_legacy_infomed.sql && ' .
               'mysql -uroot -p4r4nt0 -e "SET GLOBAL log_bin_trust_function_creators=0;"';

        $process = new Process(['docker', 'compose', 'exec', '-T', 'mysql', 'bash', '-c', $cmd]);
        $process->setWorkingDirectory($projectDir);
        $process->setTimeout(600);
        $process->run();

        if (!$process->isSuccessful()) {
            $this->error('✗ Error al importar base de datos');
            $this->error($process->getErrorOutput());
            return 1;
        }

        $this->line('<fg=green>✓ Base de datos legacy importada exitosamente</>');
        $this->newLine();

        // PASO 3: Verificar
        $this->line('<fg=yellow>Verificando importación...</>');
        $process = new Process(['docker', 'compose', 'exec', '-T', 'mysql', 'mysql', '-uroot', '-p4r4nt0', '-e', 'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema="db_legacy_infomed";']);
        $process->setWorkingDirectory($projectDir);
        $process->run();

        if ($process->isSuccessful()) {
            $output = $process->getOutput();
            preg_match('/(\d+)/', $output, $matches);
            $tableCount = $matches[1] ?? 'N/A';
            $this->line("<fg=green>✓ Tablas en db_legacy_infomed:</> {$tableCount}");
        }

        $this->newLine();

        // Limpiar
        $this->line('<fg=yellow>Limpiando archivos temporales...</>');
        $process = new Process(['docker', 'compose', 'exec', '-T', 'mysql', 'rm', '-f', '/tmp/db_legacy_infomed.sql']);
        $process->setWorkingDirectory($projectDir);
        $process->run();
        $this->line('<fg=green>✓ Limpieza completada</>');
        $this->newLine();

        $this->info('═══════════════════════════════════════════════════════════');
        $this->info('<fg=green>✓ IMPORTACIÓN COMPLETADA EXITOSAMENTE</>');
        $this->info('═══════════════════════════════════════════════════════════');
        $this->newLine();

        // Ejecutar setup:all-database dentro del contenedor automáticamente
        $this->info('Ejecutando setup:all-database dentro del contenedor...');
        $process = new Process(['docker', 'compose', 'exec', '-T', 'app', 'php', 'artisan', 'setup:all-database']);
        $process->setWorkingDirectory($projectDir);
        $process->setTimeout(300);
        $process->run(function ($type, $buffer) {
            $this->getOutput()->write($buffer);
        });

        if (!$process->isSuccessful()) {
            $this->error('✗ Error al ejecutar setup:all-database');
            $this->error($process->getErrorOutput());
            $this->newLine();
            $this->line('Puedes ejecutarlo manualmente:');
            $this->line('  <fg=blue>docker compose exec app php artisan setup:all-database</>');
            return 1;
        }

        $this->newLine();

        return 0;
    }

    /**
     * Formatea bytes a formato legible
     */
    private function formatBytes($bytes, $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
