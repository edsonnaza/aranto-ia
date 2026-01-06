<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Exception;

class LegacyMigrationService
{
    protected $legacyDB;
    protected $mainDB;

    public function __construct()
    {
        $this->legacyDB = DB::connection('legacy');
        $this->mainDB = DB::connection('mysql');
    }

    /**
     * Ejecutar una consulta en la base de datos legacy
     */
    public function queryLegacy(string $query)
    {
        try {
            return $this->legacyDB->select($query);
        } catch (Exception $e) {
            throw new Exception("Error en consulta legacy: " . $e->getMessage());
        }
    }

    /**
     * Obtener todas las tablas de la base de datos legacy
     */
    public function getLegacyTables()
    {
        $tables = $this->legacyDB->select('SHOW TABLES');
        return array_map(fn($table) => (array)$table, $tables);
    }

    /**
     * Obtener estructura de una tabla en la base de datos legacy
     */
    public function getLegacyTableStructure(string $tableName)
    {
        return $this->legacyDB->select("DESCRIBE {$tableName}");
    }

    /**
     * Obtener todas las filas de una tabla en la base de datos legacy
     */
    public function getLegacyTableData(string $tableName, ?int $limit = null)
    {
        $query = "SELECT * FROM {$tableName}";
        if ($limit) {
            $query .= " LIMIT {$limit}";
        }
        return $this->legacyDB->select($query);
    }

    /**
     * Obtener cantidad de filas en una tabla legacy
     */
    public function getLegacyTableCount(string $tableName): int
    {
        $result = $this->legacyDB->select("SELECT COUNT(*) as count FROM {$tableName}");
        return $result[0]->count ?? 0;
    }

    /**
     * Insertar datos en la base de datos principal desde legacy
     */
    public function migrateTable(string $sourceTable, string $targetTable, ?array $columnMap = null): array
    {
        try {
            $data = $this->getLegacyTableData($sourceTable);
            $count = 0;

            foreach ($data as $row) {
                $rowArray = (array)$row;
                
                // Aplicar mapeo de columnas si se proporciona
                if ($columnMap) {
                    $mappedRow = [];
                    foreach ($columnMap as $source => $target) {
                        if (isset($rowArray[$source])) {
                            $mappedRow[$target] = $rowArray[$source];
                        }
                    }
                    $rowArray = $mappedRow;
                }

                try {
                    $this->mainDB->table($targetTable)->insert($rowArray);
                    $count++;
                } catch (Exception $e) {
                    // Log del error pero continúa con el siguiente registro
                    \Log::warning("Error migrando fila de {$sourceTable}: " . $e->getMessage(), ['row' => $rowArray]);
                }
            }

            return [
                'success' => true,
                'source_table' => $sourceTable,
                'target_table' => $targetTable,
                'total_rows' => count($data),
                'migrated_rows' => $count,
                'failed_rows' => count($data) - $count,
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'source_table' => $sourceTable,
                'target_table' => $targetTable,
            ];
        }
    }

    /**
     * Obtener consulta SQL personalizada desde legacy
     */
    public function customQuery(string $query)
    {
        try {
            return $this->legacyDB->select($query);
        } catch (Exception $e) {
            throw new Exception("Error en consulta personalizada: " . $e->getMessage());
        }
    }

    /**
     * Ejecutar múltiples migraciones
     */
    public function migrateBatch(array $migrations): array
    {
        $results = [];
        foreach ($migrations as $migration) {
            $results[] = $this->migrateTable(
                $migration['source'],
                $migration['target'],
                $migration['map'] ?? null
            );
        }
        return $results;
    }

    /**
     * Verificar conexión a la base de datos legacy
     */
    public function testConnection(): bool
    {
        try {
            $this->legacyDB->select('SELECT 1');
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
}
