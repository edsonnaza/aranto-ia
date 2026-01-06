<?php

namespace App\Console\Commands;

use App\Services\LegacyMigrationService;
use Illuminate\Console\Command;

class MigrateLegacyData extends Command
{
    protected $signature = 'legacy:migrate {table? : Tabla específica a migrar} {--list : Listar todas las tablas de la base de datos legacy} {--test : Probar conexión con la base de datos legacy} {--count=10 : Cantidad de registros a migrar en prueba}';

    protected $description = 'Migrar datos desde la base de datos legacy (db_legacy_infomed)';

    protected $legacyService;

    public function __construct(LegacyMigrationService $legacyService)
    {
        parent::__construct();
        $this->legacyService = $legacyService;
    }

    public function handle()
    {
        // Prueba de conexión
        if ($this->option('test')) {
            return $this->testConnection();
        }

        // Listar tablas
        if ($this->option('list')) {
            return $this->listTables();
        }

        // Migrar tabla específica
        if ($this->argument('table')) {
            return $this->migrateTable($this->argument('table'));
        }

        // Si no hay opciones, mostrar menú
        $this->showMenu();
    }

    private function testConnection()
    {
        $this->info('Probando conexión con la base de datos legacy...');
        
        if ($this->legacyService->testConnection()) {
            $this->info('✓ Conexión exitosa con db_legacy_infomed');
            return 0;
        } else {
            $this->error('✗ No se pudo conectar a la base de datos legacy');
            return 1;
        }
    }

    private function listTables()
    {
        $this->info('Tablas en db_legacy_infomed:');
        $tables = $this->legacyService->getLegacyTables();
        
        $tableList = [];
        foreach ($tables as $table) {
            $tableName = reset($table);
            $count = $this->legacyService->getLegacyTableCount($tableName);
            $tableList[] = [
                'Tabla' => $tableName,
                'Registros' => $count,
            ];
        }

        $this->table(['Tabla', 'Registros'], $tableList);
        return 0;
    }

    private function migrateTable(string $tableName)
    {
        $this->info("Obteniendo estructura de la tabla: {$tableName}");
        
        try {
            $structure = $this->legacyService->getLegacyTableStructure($tableName);
            $this->line("\nEstructura de la tabla {$tableName}:");
            
            $columns = [];
            foreach ($structure as $field) {
                $columns[] = [
                    'Campo' => $field->Field,
                    'Tipo' => $field->Type,
                    'Nulo' => $field->Null,
                    'Clave' => $field->Key,
                ];
            }
            
            $this->table(['Campo', 'Tipo', 'Nulo', 'Clave'], $columns);
            
            $count = $this->legacyService->getLegacyTableCount($tableName);
            $this->line("\nTotal de registros: {$count}");
            
            // Opción de migrar
            if ($this->confirm("¿Deseas migrar esta tabla a aranto_medical?")) {
                $this->info("Migrando tabla {$tableName}...");
                $result = $this->legacyService->migrateTable($tableName, $tableName);
                
                if ($result['success']) {
                    $this->info("✓ Migración completada");
                    $this->line("  - Registros migrados: {$result['migrated_rows']}/{$result['total_rows']}");
                    if ($result['failed_rows'] > 0) {
                        $this->warn("  - Registros fallidos: {$result['failed_rows']}");
                    }
                } else {
                    $this->error("✗ Error en migración: {$result['error']}");
                    return 1;
                }
            }
            
            return 0;
        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
            return 1;
        }
    }

    private function showMenu()
    {
        $this->info('=== Migración de Datos Legacy ===');
        $this->line('');
        $this->line('Opciones disponibles:');
        $this->line('  php artisan legacy:migrate --test          Probar conexión');
        $this->line('  php artisan legacy:migrate --list          Listar tablas');
        $this->line('  php artisan legacy:migrate {tabla}         Migrar tabla específica');
        $this->line('');
        
        $choice = $this->choice(
            'Selecciona una opción',
            [
                'Probar conexión',
                'Listar tablas',
                'Migrar tabla específica',
                'Salir',
            ]
        );

        switch ($choice) {
            case 'Probar conexión':
                return $this->testConnection();
            case 'Listar tablas':
                return $this->listTables();
            case 'Migrar tabla específica':
                $table = $this->ask('Ingresa el nombre de la tabla a migrar');
                return $this->migrateTable($table);
            default:
                return 0;
        }
    }
}
