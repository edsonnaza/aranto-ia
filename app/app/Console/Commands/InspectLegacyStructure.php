<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class InspectLegacyStructure extends Command
{
    protected $signature = 'legacy:inspect {table} {--limit=5}';
    protected $description = 'Inspecciona la estructura y datos de una tabla en legacy';

    public function handle()
    {
        $table = $this->argument('table');
        $limit = $this->option('limit');

        try {
            // Obtener estructura
            $this->info("\n📋 Estructura de tabla: {$table}");
            $this->line(str_repeat('─', 80));
            
            $structure = DB::connection('legacy')->select("DESCRIBE {$table}");
            $this->table(
                ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'],
                array_map(function($col) {
                    return [
                        $col->Field,
                        $col->Type,
                        $col->Null,
                        $col->Key ?? '',
                        $col->Default ?? '',
                        $col->Extra ?? ''
                    ];
                }, $structure)
            );

            // Obtener datos de ejemplo
            $this->info("\n📊 Primeros {$limit} registros:");
            $this->line(str_repeat('─', 80));
            
            $data = DB::connection('legacy')->select("SELECT * FROM {$table} LIMIT {$limit}");
            
            if (empty($data)) {
                $this->warn('No hay datos en esta tabla');
                return 0;
            }

            // Convertir a array para mostrar en tabla
            $headers = array_keys((array)$data[0]);
            $rows = array_map(function($item) {
                return array_values((array)$item);
            }, $data);

            $this->table($headers, $rows);

            // Contar total de registros
            $count = DB::connection('legacy')->select("SELECT COUNT(*) as count FROM {$table}");
            $this->info("\n✓ Total de registros: {$count[0]->count}");

            return 0;

        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
            return 1;
        }
    }
}
