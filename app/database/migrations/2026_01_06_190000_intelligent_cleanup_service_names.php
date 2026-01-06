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
        echo "Limpieza final inteligente de caracteres duplicados\n";
        echo str_repeat('=', 80) . "\n\n";

        // Obtener servicios y hacer limpieza inteligente
        $services = DB::table('services')->get();
        $updated = 0;

        foreach ($services as $service) {
            $original = $service->name;
            $cleaned = $original;

            // Limpiar caracteres duplicados y corruptos
            // Reemplazar patrones problemáticos
            $cleaned = str_ireplace(['ióica', 'íómica', 'iómica'], 'ímica', $cleaned);
            $cleaned = str_ireplace(['ónón', 'cionción'], 'ción', $cleaned);
            $cleaned = str_ireplace(['íí'], 'í', $cleaned);
            $cleaned = str_ireplace(['óó'], 'ó', $cleaned);
            $cleaned = str_ireplace(['ár', 'áa'], 'á', $cleaned);
            
            // Remover caracteres huérfanos
            $cleaned = str_replace('¿', '', $cleaned);
            $cleaned = str_replace('½', '', $cleaned);
            
            // Normalizar espacios
            $cleaned = preg_replace('/\s+/', ' ', trim($cleaned));

            if ($original !== $cleaned) {
                DB::table('services')
                    ->where('id', $service->id)
                    ->update(['name' => $cleaned]);
                
                $updated++;
                
                echo "✓ ID " . str_pad($service->id, 4) . "\n";
                echo "  Original: " . substr($original, 0, 60) . "\n";
                echo "  Limpio:   " . substr($cleaned, 0, 60) . "\n";
            }
        }

        echo "\n" . str_repeat('=', 80) . "\n";
        echo "Total actualizado: {$updated} servicios\n";
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
