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
        Schema::create('service_prices', function (Blueprint $table) {
            $table->id();
            
            // Referencias principales (tabla pivot)
            $table->foreignId('service_id')->constrained('medical_services')->onDelete('cascade');
            $table->foreignId('insurance_type_id')->constrained('insurance_types');
            
            // Precio y vigencia
            $table->decimal('price', 10, 2);
            $table->date('effective_from');
            $table->date('effective_until')->nullable(); // NULL = vigente indefinidamente
            
            // Metadatos
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Índices para performance
            $table->index('service_id');
            $table->index('insurance_type_id');
            $table->index(['effective_from', 'effective_until']);
            $table->index(['service_id', 'insurance_type_id', 'effective_from', 'effective_until'], 'idx_current_prices');
            
            // Constraint único para evitar solapamiento de períodos
            $table->unique(['service_id', 'insurance_type_id', 'effective_from'], 'unique_service_insurance_period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_prices');
    }
};
