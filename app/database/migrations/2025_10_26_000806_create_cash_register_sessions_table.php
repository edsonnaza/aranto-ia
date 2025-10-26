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
        Schema::create('cash_register_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->datetime('opening_date');
            $table->datetime('closing_date')->nullable();
            $table->decimal('initial_amount', 12, 2)->default(0.00);
            $table->decimal('final_physical_amount', 12, 2)->nullable();
            $table->decimal('calculated_balance', 12, 2)->default(0.00);
            $table->decimal('total_income', 12, 2)->default(0.00);
            $table->decimal('total_expenses', 12, 2)->default(0.00);
            $table->decimal('difference', 12, 2)->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->text('difference_justification')->nullable();
            $table->foreignId('authorized_by')->nullable()->constrained('users');
            $table->timestamps();

            // Indexes
            $table->index(['user_id', 'opening_date'], 'idx_cash_register_sessions_user_date');
            $table->index('status', 'idx_cash_register_sessions_status');
            $table->index('authorized_by', 'idx_cash_register_sessions_authorized_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_register_sessions');
    }
};
