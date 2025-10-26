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
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->decimal('base_price', 10, 2);
            $table->enum('category', ['CONSULTATION', 'PROCEDURE', 'EMERGENCY', 'HOSPITALIZATION', 'DIAGNOSTIC', 'OTHER']);
            $table->boolean('is_active')->default(true);
            $table->decimal('professional_commission_percentage', 5, 2)->default(0.00);
            $table->timestamps();

            // Indexes
            $table->index('code', 'idx_services_code');
            $table->index('category', 'idx_services_category');
            $table->index('is_active', 'idx_services_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
