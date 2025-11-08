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
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            
            // Documentos de identificación
            $table->enum('document_type', ['CI', 'PASSPORT', 'OTHER']);
            $table->string('document_number', 20);
            
            // Datos personales
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->date('birth_date');
            $table->enum('gender', ['M', 'F', 'OTHER']);
            $table->string('phone', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            
            // Seguro médico
            $table->foreignId('insurance_type_id')->constrained('insurance_types');
            $table->string('insurance_number', 50)->nullable();
            $table->date('insurance_valid_until')->nullable();
            $table->decimal('insurance_coverage_percentage', 5, 2)->default(100.00);
            
            // Estado y control
            $table->enum('status', ['active', 'inactive', 'deceased'])->default('active');
            $table->string('emergency_contact_name', 100)->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Índices
            $table->unique(['document_type', 'document_number'], 'unique_document');
            $table->index(['first_name', 'last_name'], 'idx_full_name');
            $table->index('insurance_type_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
