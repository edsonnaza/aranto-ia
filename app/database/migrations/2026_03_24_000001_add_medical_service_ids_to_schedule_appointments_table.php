<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schedule_appointments', function (Blueprint $table) {
            $table->json('medical_service_ids')->nullable()->after('medical_service_id');
        });
    }

    public function down(): void
    {
        Schema::table('schedule_appointments', function (Blueprint $table) {
            $table->dropColumn('medical_service_ids');
        });
    }
};
