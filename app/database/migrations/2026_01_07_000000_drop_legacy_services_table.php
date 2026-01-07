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
     * Elimina la tabla legacy 'services' que fue reemplazada por 'medical_services'
     * con una arquitectura mejorada para soportar múltiples precios por seguro.
     */
    public function up(): void
    {
        // Deshabilitar checks de foreign key temporalmente
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        try {
            // Eliminar foreign keys que puedan referenciar a services
            if (Schema::hasTable('service_service_category')) {
                Schema::dropIfExists('service_service_category');
            }
            
            // Eliminar tabla legacy
            if (Schema::hasTable('services')) {
                Schema::dropIfExists('services');
            }
        } finally {
            // Re-habilitar checks de foreign key
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No restaurar tabla legacy - no es reversible en producción
        // La tabla 'medical_services' es la versión correcta
    }
};
