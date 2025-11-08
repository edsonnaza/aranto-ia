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
        Schema::create('professional_specialties', function (Blueprint $table) {
            $table->id();
            
            // Referencias principales
            $table->foreignId('professional_id')->constrained('professionals')->onDelete('cascade');
            $table->foreignId('specialty_id')->constrained('specialties');
            
            // Información de certificación
            $table->date('certification_date')->nullable();
            $table->string('certification_number', 50)->nullable();
            $table->boolean('is_primary')->default(false); // Especialidad principal
            
            $table->timestamps();
            
            // Índices y constraints
            $table->unique(['professional_id', 'specialty_id']);
            $table->index('professional_id');
            $table->index('specialty_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('professional_specialties');
    }
};
