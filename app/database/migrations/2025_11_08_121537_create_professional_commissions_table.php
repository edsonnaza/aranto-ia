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
        Schema::create('professional_commissions', function (Blueprint $table) {
            $table->id();
            
            // Foreign Keys
            $table->foreignId('professional_id')->constrained('professionals')->onDelete('cascade');
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('medical_service_id')->constrained('medical_services')->onDelete('cascade');
            $table->foreignId('insurance_type_id')->nullable()->constrained('insurance_types')->onDelete('set null');
            
            // Commission Details
            $table->decimal('service_amount', 10, 2); // Total amount of the service
            $table->decimal('commission_percentage', 5, 2); // Percentage applied
            $table->decimal('commission_amount', 10, 2); // Calculated commission
            $table->enum('commission_type', ['percentage', 'fixed_amount'])->default('percentage');
            $table->enum('status', ['pending', 'calculated', 'paid', 'cancelled'])->default('calculated');
            
            // Service Information
            $table->string('service_code', 20); // Reference to service code at time of commission
            $table->string('service_name', 200); // Service name at time of commission
            $table->date('service_date'); // Date when service was provided
            
            // Payment tracking
            $table->date('payment_date')->nullable(); // When commission was paid
            $table->string('payment_reference', 100)->nullable(); // Payment reference number
            $table->text('notes')->nullable(); // Additional notes
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['professional_id', 'service_date']);
            $table->index(['status', 'service_date']);
            $table->index('payment_date');
            $table->index('service_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('professional_commissions');
    }
};
