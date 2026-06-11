<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lab_test_profiles', function (Blueprint $table) {
            $table->foreignId('lab_area_id')
                ->nullable()
                ->after('medical_service_id')
                ->constrained('lab_areas')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lab_test_profiles', function (Blueprint $table) {
            $table->dropForeign(['lab_area_id']);
            $table->dropColumn('lab_area_id');
        });
    }
};
