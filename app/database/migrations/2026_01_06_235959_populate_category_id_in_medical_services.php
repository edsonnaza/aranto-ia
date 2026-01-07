<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Llena el campo category_id en medical_services basándose en la tabla pivot service_service_category
     * Esto consolida una relación 1:N donde cada servicio tiene una categoría principal.
     */
    public function up(): void
    {
        // Poblar category_id desde la tabla pivot
        // Asumimos que el primer registro en la pivot es la categoría principal
        DB::statement('
            UPDATE medical_services ms
            SET category_id = (
                SELECT service_category_id
                FROM service_service_category ssc
                WHERE ssc.service_id = ms.id
                LIMIT 1
            )
            WHERE category_id IS NULL
        ');

        // Verificar que se poblaron correctamente
        $serviciosConCategoria = DB::table('medical_services')
            ->whereNotNull('category_id')
            ->count();
        
        $serviciosSinCategoria = DB::table('medical_services')
            ->whereNull('category_id')
            ->count();

        echo "✅ Servicios con categoría: " . $serviciosConCategoria . "\n";
        echo "⚠️  Servicios sin categoría: " . $serviciosSinCategoria . "\n";

        // Si aún hay servicios sin categoría, asignarles la categoría "Otros Generales"
        if ($serviciosSinCategoria > 0) {
            $otrosCategory = DB::table('service_categories')
                ->where('name', 'Otros Generales')
                ->first();
            
            if ($otrosCategory) {
                DB::table('medical_services')
                    ->whereNull('category_id')
                    ->update(['category_id' => $otrosCategory->id]);
                echo "✅ Servicios sin categoría asignados a 'Otros Generales'\n";
            } else {
                echo "⚠️  No se encontró categoría 'Otros Generales'\n";
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Limpiar category_id si es necesario reverter
        DB::table('medical_services')
            ->update(['category_id' => null]);
    }
};
