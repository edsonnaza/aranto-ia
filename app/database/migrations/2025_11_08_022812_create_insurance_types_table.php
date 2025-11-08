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
        Schema::create('insurance_types', function (Blueprint $table) {
            $table->id();
            
            // Información básica
            $table->string('name', 100); // "Particular", "Unimed", "OSDE", etc.
            $table->string('code', 20)->unique(); // Código único
            $table->text('description')->nullable();
            
            // Configuración de facturación
            $table->boolean('requires_authorization')->default(false);
            $table->decimal('coverage_percentage', 5, 2)->default(100.00);
            $table->boolean('has_copay')->default(false);
            $table->decimal('copay_amount', 10, 2)->default(0.00);
            
            // Contacto y administración
            $table->string('contact_name', 100)->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->string('contact_email', 100)->nullable();
            $table->text('billing_address')->nullable();
            
            // Estado
            $table->enum('status', ['active', 'inactive'])->default('active');
            
            $table->timestamps();
            
            // Índices
            $table->index('name');
            $table->index('code');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('insurance_types');
    }
};
