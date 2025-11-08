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
        Schema::create('patient_insurances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('insurance_type_id')->constrained('insurance_types')->onDelete('cascade');
            
            // Detalles específicos del seguro para este paciente
            $table->string('insurance_number', 50)->nullable();
            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();
            $table->decimal('coverage_percentage', 5, 2)->default(100.00);
            $table->boolean('is_primary')->default(false); // Seguro principal
            $table->enum('status', ['active', 'inactive', 'expired'])->default('active');
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Índices
            $table->unique(['patient_id', 'insurance_type_id'], 'unique_patient_insurance');
            $table->index(['patient_id', 'is_primary']);
            $table->index('insurance_type_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_insurances');
    }
};
