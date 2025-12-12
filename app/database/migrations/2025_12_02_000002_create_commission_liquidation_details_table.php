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
        Schema::create('commission_liquidation_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('liquidation_id')->constrained('commission_liquidations')->onDelete('cascade');
            $table->foreignId('service_request_id')->constrained('service_requests');
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('service_id')->constrained('services');
            $table->date('service_date');
            $table->date('payment_date');
            $table->decimal('service_amount', 12, 2);
            $table->decimal('commission_percentage', 5, 2);
            $table->decimal('commission_amount', 12, 2);
            $table->foreignId('payment_movement_id')->constrained('transactions');
            $table->timestamps();

            $table->index('liquidation_id', 'idx_liquidation_details_liquidation');
            $table->index('service_request_id', 'idx_liquidation_details_service_request');
            $table->index('patient_id', 'idx_liquidation_details_patient');
            $table->index('service_id', 'idx_liquidation_details_service');
            $table->index('payment_movement_id', 'idx_liquidation_details_payment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commission_liquidation_details');
    }
};