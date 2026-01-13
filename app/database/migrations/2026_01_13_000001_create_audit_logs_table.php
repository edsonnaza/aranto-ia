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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            
            // Entidad auditada
            $table->string('model_type'); // Ej: 'Patient'
            $table->unsignedBigInteger('model_id');
            
            // Usuario que realizó la acción
            $table->foreignId('user_id')->nullable()->constrained('users');
            
            // Acción y cambios
            $table->enum('action', ['created', 'updated', 'deleted', 'inactivated', 'restored']);
            $table->text('changes')->nullable(); // JSON con los cambios
            $table->text('old_values')->nullable(); // JSON con valores anteriores
            $table->text('new_values')->nullable(); // JSON con valores nuevos
            
            // Contexto
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            
            $table->timestamps();
            
            // Índices
            $table->index(['model_type', 'model_id']);
            $table->index('user_id');
            $table->index('action');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
