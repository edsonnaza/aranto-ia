<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        echo "\n" . str_repeat('=', 80) . "\n";
        echo "Limpieza final de nombres de servicios corruptos\n";
        echo str_repeat('=', 80) . "\n\n";

        // Reemplazos específicos para patrones corruptos comunes
        $replacements = [
            // Patrón: ióa -> ía (resultado de limpieza anterior incorrecta)
            'ióa' => 'ía',
            'íoa' => 'ía',
            'óa' => 'ó',
            
            // Otros patrones corruptos
            'Ecografióa' => 'Ecografía',
            'Cauterizacií' => 'Cauterización',
            'Cauterizacii' => 'Cauterización',
            'Quirúrgica' => 'Quirúrgica',
            'Química' => 'Química',
            
            // Dobles caracteres corruptos
            '¿¿' => '',
            '½½' => '',
            '¿½' => 'ó',
            '½¿' => 'ó',
        ];

        foreach ($replacements as $search => $replace) {
            $updated = DB::table('services')
                ->where('name', 'LIKE', '%' . $search . '%')
                ->update(['name' => DB::raw("REPLACE(name, '{$search}', '{$replace}')")]);
            
            if ($updated > 0) {
                echo "✓ Reemplazado '{$search}' → '{$replace}': {$updated} servicios\n";
            }
        }

        // Mostrar ejemplos de servicios que fueron corregidos
        echo "\n" . "Ejemplos de servicios corregidos:\n";
        $examples = DB::table('services')
            ->whereRaw("name LIKE '%Ecograf%' OR name LIKE '%Cauteri%' OR name LIKE '%Quirú%'")
            ->select('id', 'name')
            ->limit(10)
            ->get();

        foreach ($examples as $ex) {
            echo "  ID " . str_pad($ex->id, 4) . " | " . $ex->name . "\n";
        }

        echo "\n" . str_repeat('=', 80) . "\n";
        echo "Limpieza completada\n";
        echo str_repeat('=', 80) . "\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No se puede revertir
    }
};
