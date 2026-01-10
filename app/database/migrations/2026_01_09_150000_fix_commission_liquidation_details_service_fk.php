<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the constraint that references wrong table
        Schema::table('commission_liquidation_details', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
        });

        // Add correct constraint to medical_services
        Schema::table('commission_liquidation_details', function (Blueprint $table) {
            $table->foreign('service_id')
                ->references('id')
                ->on('medical_services')
                ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('commission_liquidation_details', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
        });

        Schema::table('commission_liquidation_details', function (Blueprint $table) {
            $table->foreign('service_id')
                ->references('id')
                ->on('services')
                ->onDelete('restrict');
        });
    }
};
