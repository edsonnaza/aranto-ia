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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('cash_register_session_id');
            $table->foreign('cash_register_session_id')->references('id')->on('cash_register_sessions')->onDelete('cascade');
            $table->enum('type', ['INCOME', 'EXPENSE']);
            $table->enum('category', ['SERVICE_PAYMENT', 'SUPPLIER_PAYMENT', 'COMMISSION_LIQUIDATION', 'CASH_DIFFERENCE', 'OTHER']);
            $table->decimal('amount', 12, 2);
            $table->string('concept', 255);
            $table->bigInteger('patient_id')->unsigned()->nullable();
            $table->bigInteger('professional_id')->unsigned()->nullable();
            $table->bigInteger('liquidation_id')->unsigned()->nullable();
            $table->foreignId('user_id')->constrained('users');
            $table->enum('status', ['active', 'cancelled'])->default('active');
            $table->bigInteger('original_transaction_id')->unsigned()->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->bigInteger('cancelled_by')->unsigned()->nullable();
            $table->datetime('cancelled_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['cash_register_session_id', 'created_at'], 'idx_transactions_session_date');
            $table->index(['type', 'created_at'], 'idx_transactions_type_date');
            $table->index('status', 'idx_transactions_status');
            $table->index('patient_id', 'idx_transactions_patient');
            $table->index('professional_id', 'idx_transactions_professional');
            $table->index('liquidation_id', 'idx_transactions_liquidation');
            $table->index('user_id', 'idx_transactions_user');
            $table->index('cancelled_by', 'idx_transactions_cancelled_by');
            $table->index('original_transaction_id', 'idx_transactions_original');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
