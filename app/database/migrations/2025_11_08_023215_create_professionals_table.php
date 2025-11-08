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
        Schema::create('professionals', function (Blueprint $table) {
            $table->id();
            
            // Vinculación opcional con sistema de usuarios
            $table->foreignId('user_id')->nullable()->constrained('users');
            
            // Datos personales
            $table->enum('document_type', ['CI', 'PASSPORT', 'OTHER']);
            $table->string('document_number', 20);
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->date('birth_date')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->text('address')->nullable();
            
            // Datos profesionales
            $table->string('professional_license', 50)->nullable(); // Matrícula profesional
            $table->date('license_expiry_date')->nullable();
            $table->string('title', 100)->nullable(); // Dr., Lic., etc.
            
            // Sistema de comisiones
            $table->decimal('commission_percentage', 5, 2)->default(0.00); // Ej: 70.00 = 70%
            $table->enum('commission_calculation_method', ['percentage', 'fixed_amount', 'custom'])->default('percentage');
            
            // Estado
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->date('hire_date')->nullable();
            $table->date('termination_date')->nullable();
            
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Índices y constraints
            $table->unique(['document_type', 'document_number']);
            $table->unique('professional_license');
            $table->index(['first_name', 'last_name']);
            $table->index('status');
            $table->index('commission_percentage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('professionals');
    }
};
