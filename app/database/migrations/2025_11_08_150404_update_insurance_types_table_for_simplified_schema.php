<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('insurance_types', function (Blueprint $table) {
            // Agregar nuevo campo active como boolean
            $table->boolean('active')->default(true);
            
            // Agregar campo deductible_amount como decimal
            $table->decimal('deductible_amount', 10, 2)->nullable();
            
            // Eliminar campos que no necesitamos (comentado para evitar pérdida de datos)
            // $table->dropColumn([
            //     'code',
            //     'requires_authorization', 
            //     'has_copay',
            //     'copay_amount',
            //     'contact_name',
            //     'contact_phone', 
            //     'contact_email',
            //     'billing_address',
            //     'status'
            // ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('insurance_types', function (Blueprint $table) {
            // Revertir los cambios
            $table->dropColumn(['active', 'deductible_amount']);
        });
    }
};
