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
        Schema::create('professional_services', function (Blueprint $table) {
            $table->id();
            
            // Foreign Keys
            $table->foreignId('professional_id')->constrained('professionals')->onDelete('cascade');
            $table->foreignId('medical_service_id')->constrained('medical_services')->onDelete('cascade');
            
            // Additional fields
            $table->boolean('is_primary')->default(false); // If this is the primary service for the professional
            $table->decimal('custom_commission_percentage', 5, 2)->nullable(); // Override default commission
            $table->boolean('is_active')->default(true); // Can temporarily disable service for professional
            
            $table->timestamps();
            
            // Unique constraint to prevent duplicates
            $table->unique(['professional_id', 'medical_service_id']);
            
            // Indexes for performance
            $table->index('is_primary');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('professional_services');
    }
};
