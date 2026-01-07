<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - Drop and recreate the FK to point to 'services' instead of 'medical_services'
     */
    public function up(): void
    {
        // Drop the old foreign key constraint
        Schema::table('service_prices', function (Blueprint $table) {
            $table->dropForeign('service_prices_service_id_foreign');
        });

        // Re-add the foreign key pointing to 'medical_services' table
        Schema::table('service_prices', function (Blueprint $table) {
            $table->foreign('service_id')
                ->references('id')
                ->on('medical_services')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_prices', function (Blueprint $table) {
            $table->dropForeign('service_prices_service_id_foreign');
        });

        // Restore the old FK (if needed for rollback)
        Schema::table('service_prices', function (Blueprint $table) {
            $table->foreign('service_id')
                ->references('id')
                ->on('medical_services')
                ->onDelete('cascade');
        });
    }
};
