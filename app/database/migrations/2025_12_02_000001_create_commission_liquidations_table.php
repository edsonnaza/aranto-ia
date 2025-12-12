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
        Schema::create('commission_liquidations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professional_id')->constrained('professionals');
            $table->date('period_start');
            $table->date('period_end');
            $table->integer('total_services')->default(0);
            $table->decimal('gross_amount', 12, 2)->default(0);
            $table->decimal('commission_percentage', 5, 2);
            $table->decimal('commission_amount', 12, 2)->default(0);
            $table->enum('status', ['draft', 'approved', 'paid', 'cancelled'])->default('draft');
            $table->foreignId('generated_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->foreignId('payment_movement_id')->nullable()->constrained('transactions');
            $table->timestamps();

            $table->index(['professional_id', 'period_start', 'period_end'], 'idx_liquidations_professional_period');
            $table->index('status', 'idx_liquidations_status');
            $table->index('generated_by', 'idx_liquidations_generated_by');
            $table->index('approved_by', 'idx_liquidations_approved_by');
            $table->index('payment_movement_id', 'idx_liquidations_payment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commission_liquidations');
    }
};