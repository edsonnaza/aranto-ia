<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Helpers\ServiceCodeHelper;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Obtener todos los servicios con caracteres corruptos
        $corruptedServices = DB::table('services')
            ->whereRaw("name LIKE '%¿%' OR name LIKE '%Â%' OR name LIKE '%Ã%'")
            ->get();

        echo "\n" . str_repeat('=', 70) . "\n";
        echo "Limpiando " . count($corruptedServices) . " servicios con caracteres corruptos\n";
        echo str_repeat('=', 70) . "\n\n";

        foreach ($corruptedServices as $service) {
            $originalName = $service->name;
            
            // Limpiar caracteres corruptos
            $cleanedName = ServiceCodeHelper::cleanCorruptedUtf8($originalName);
            
            // Si cambió, actualizar
            if ($originalName !== $cleanedName) {
                DB::table('services')
                    ->where('id', $service->id)
                    ->update(['name' => $cleanedName]);
                
                echo "✓ ID {$service->id}:\n";
                echo "  Original: {$originalName}\n";
                echo "  Limpio:   {$cleanedName}\n\n";
            }
        }

        echo str_repeat('=', 70) . "\n";
        echo "Limpieza completada\n";
        echo str_repeat('=', 70) . "\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No se puede revertir automáticamente
        // La corrupción original se perdió
    }
};
