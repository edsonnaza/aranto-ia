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
        Schema::create('medical_services', function (Blueprint $table) {
            $table->id();
            
            // Información básica
            $table->string('name', 200); // "Consulta General", "Radiografía", etc.
            $table->string('code', 50)->unique()->nullable(); // Código interno o nomenclador
            $table->text('description')->nullable();
            
            // Categorización
            $table->foreignId('category_id')->nullable()->constrained('service_categories');
            
            // Configuración del servicio
            $table->integer('duration_minutes')->default(30);
            $table->boolean('requires_appointment')->default(true);
            $table->boolean('requires_preparation')->default(false);
            $table->text('preparation_instructions')->nullable();
            
            // Comisiones por defecto
            $table->decimal('default_commission_percentage', 5, 2)->default(0.00);
            
            // Estado
            $table->enum('status', ['active', 'inactive'])->default('active');
            
            $table->timestamps();
            
            // Índices
            $table->index('name');
            $table->index('code');
            $table->index('category_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medical_services');
    }
};
