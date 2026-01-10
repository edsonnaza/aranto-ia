<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class VerifyMappingConsistency extends Command
{
    protected $signature = 'verify:mapping';
    protected $description = 'Verifica que el mapeo de categorías legacy→aranto sea consistente';

    public function handle()
    {
        $this->info("\n🔍 VERIFICACIÓN DE MAPEO DE CATEGORÍAS\n");
        $this->line(str_repeat('─', 100));

        // Obtener categorías actuales en aranto
        $arantoCategories = DB::table('service_categories')
            ->orderBy('id')
            ->get(['id', 'name']);

        $this->info("\n📊 Categorías actuales en aranto.service_categories:\n");
        $categoriesTable = $arantoCategories->map(fn($c) => [$c->id, $c->name])->toArray();
        $this->table(['ID', 'Nombre'], $categoriesTable);

        // Categorías que se migran de legacy (mapeo DIRECTO: legacy_id = aranto_id)
        $categoriesAllowed = [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 39, 40, 41, 45, 46, 47, 48];
        $categoriesExcluded = [38, 42, 43, 44]; // Cocina, Medicamentos, Descartables, Otros Farmacia

        $this->info("\n📋 MAPEO (DIRECTO - Legacy ID = Aranto ID):\n");
        $this->info("✅ Categorías a MIGRAR:");
        $migrationTable = [];
        foreach ($categoriesAllowed as $id) {
            $migrationTable[] = [$id, '→', $id];
        }
        $this->table(['Legacy ID', '', 'Aranto ID'], $migrationTable);

        $this->info("\n❌ Categorías EXCLUIDAS (no son servicios médicos):");
        $excludedTable = [];
        foreach ($categoriesExcluded as $id) {
            $cat = $arantoCategories->where('id', $id)->first();
            $excludedTable[] = [$id, $cat ? $cat->name : 'N/A'];
        }
        $this->table(['ID', 'Nombre'], $excludedTable);

        // Verificar consistencia
        $this->info("\n✅ Verificando que todas las categorías a migrar existan:\n");
        $allValid = true;
        foreach ($categoriesAllowed as $id) {
            $exists = $arantoCategories->where('id', $id)->first();
            if ($exists) {
                $this->line("  ✓ ID {$id} ({$exists->name})");
            } else {
                $this->error("  ✗ ID {$id} - NO EXISTE EN ARANTO");
                $allValid = false;
            }
        }

        $this->line("\n" . str_repeat('─', 100));
        if ($allValid) {
            $this->info("\n✅ MAPEO CONSISTENTE Y VÁLIDO - LISTO PARA MIGRACIÓN");
            $this->line("Se migrarán " . count($categoriesAllowed) . " categorías de servicios médicos");
            $this->line("Se excluirán " . count($categoriesExcluded) . " categorías que no son servicios");
        } else {
            $this->error("\n❌ EXISTEN INCONSISTENCIAS EN EL MAPEO");
        }
        $this->line("");

        return $allValid ? 0 : 1;
    }
}
