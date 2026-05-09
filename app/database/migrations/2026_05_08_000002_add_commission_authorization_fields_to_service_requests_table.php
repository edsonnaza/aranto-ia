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
        Schema::table('service_requests', function (Blueprint $table) {
            $table->timestamp('commission_authorized_at')->nullable();
            $table->foreignId('commission_authorized_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->index('commission_authorized_at', 'sr_commission_authorized_at_idx');
            $table->index('commission_authorized_by', 'sr_commission_authorized_by_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropIndex('sr_commission_authorized_at_idx');
            $table->dropIndex('sr_commission_authorized_by_idx');
            $table->dropConstrainedForeignId('commission_authorized_by');
            $table->dropColumn('commission_authorized_at');
        });
    }
};