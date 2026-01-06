<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        echo "\n" . str_repeat('=', 80) . "\n";
        echo "Limpieza final agresiva - Reemplazos específicos\n";
        echo str_repeat('=', 80) . "\n\n";

        // Reemplazos específicos basados en patrones conocidos
        $replacements = [
            // Cauterización variants
            'Cauterizacición' => 'Cauterización',
            'Cauterizacii' => 'Cauterización',
            'Cauterizacií' => 'Cauterización',
            
            // Química
            'Quiómica' => 'Química',
            'Quiímica' => 'Química',
            'Químiica' => 'Química',
            
            // Duplicados de ción/sión
            'cionción' => 'ción',
            'siónsión' => 'sión',
            'acionación' => 'ación',
            
            // Duplicados de tilde
            'íí' => 'í',
            'óó' => 'ó',
            'áá' => 'á',
            'éé' => 'é',
            'úú' => 'ú',
            
            // Caracteres corruptos
            '¿' => '',
            '½' => '',
        ];

        foreach ($replacements as $search => $replace) {
            $count = DB::table('services')
                ->where('name', 'LIKE', '%' . $search . '%')
                ->count();
            
            if ($count > 0) {
                DB::table('services')
                    ->where('name', 'LIKE', '%' . $search . '%')
                    ->update(['name' => DB::raw("REPLACE(name, '{$search}', '{$replace}')")]);
                
                echo "✓ '{$search}' → '{$replace}': {$count} servicios\n";
            }
        }

        // Mostrar estado final
        echo "\n" . "Estado final de servicios problemáticos:\n";
        $final = DB::table('services')
            ->whereRaw("name LIKE '%Cauteri%' OR name LIKE '%Quím%' OR name LIKE '%Ecograf%'")
            ->select('id', 'name')
            ->limit(15)
            ->get();

        foreach ($final as $service) {
            echo "  ID " . str_pad($service->id, 4) . " | " . $service->name . "\n";
        }

        echo "\n" . str_repeat('=', 80) . "\n";
        echo "Limpieza completada\n";
        echo str_repeat('=', 80) . "\n";
    }

    public function down(): void
    {
        // No se puede revertir
    }
};
