<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lab_test_profiles', function (Blueprint $table) {
            $table->string('validation_type', 30)->default('none')->after('status');
            $table->decimal('validation_target', 8, 2)->default(100)->after('validation_type');
            $table->decimal('validation_tolerance', 8, 2)->default(0)->after('validation_target');
        });

        Schema::table('lab_test_parameters', function (Blueprint $table) {
            $table->boolean('include_in_sum_100')->default(false)->after('is_required');
        });
    }

    public function down(): void
    {
        Schema::table('lab_test_profiles', function (Blueprint $table) {
            $table->dropColumn(['validation_type', 'validation_target', 'validation_tolerance']);
        });

        Schema::table('lab_test_parameters', function (Blueprint $table) {
            $table->dropColumn('include_in_sum_100');
        });
    }
};
