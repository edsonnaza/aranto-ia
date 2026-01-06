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
            ->whereRaw("name LIKE '%¿%' OR name LIKE '%Â%' OR name LIKE '%Ã%' OR name LIKE '%Ecografi%'")
            ->get();

        echo "\n" . str_repeat('=', 80) . "\n";
        echo "Limpiando caracteres corruptos UTF-8 en " . count($corruptedServices) . " servicios\n";
        echo str_repeat('=', 80) . "\n\n";

        $updated = 0;

        foreach ($corruptedServices as $service) {
            $originalName = $service->name;
            
            // Limpiar caracteres corruptos
            $cleanedName = ServiceCodeHelper::cleanCorruptedUtf8($originalName);
            
            // Si cambió, actualizar
            if ($originalName !== $cleanedName) {
                DB::table('services')
                    ->where('id', $service->id)
                    ->update(['name' => $cleanedName]);
                
                echo "✓ ID " . str_pad($service->id, 4) . " | Original: " . str_pad(substr($originalName, 0, 40), 40) . "\n";
                echo "             | Limpio:   " . str_pad(substr($cleanedName, 0, 40), 40) . "\n";
                
                $updated++;
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
        // No se puede revertir automáticamente
    }
};
