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
        Schema::table('transactions', function (Blueprint $table) {
            // Campo para rastrear qué transacciones están asociadas a liquidaciones de comisiones
            $table->foreignId('commission_liquidation_id')
                ->nullable()
                ->after('service_request_id')
                ->constrained('commission_liquidations')
                ->nullOnDelete();
            
            $table->index('commission_liquidation_id', 'idx_transactions_commission_liquidation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['commission_liquidation_id']);
            $table->dropIndex('idx_transactions_commission_liquidation');
            $table->dropColumn('commission_liquidation_id');
        });
    }
};
