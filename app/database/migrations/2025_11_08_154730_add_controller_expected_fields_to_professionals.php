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
        Schema::table('professionals', function (Blueprint $table) {
            // Add fields expected by ProfessionalController
            $table->string('identification', 20)->nullable()->after('user_id');
            $table->string('license_number', 50)->nullable()->after('professional_license');
            $table->boolean('is_active')->default(true)->after('status');
        });

        // Populate new fields with existing data
        DB::statement('UPDATE professionals SET identification = document_number');
        DB::statement('UPDATE professionals SET license_number = professional_license');
        DB::statement('UPDATE professionals SET is_active = CASE WHEN status = "active" THEN 1 ELSE 0 END');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('professionals', function (Blueprint $table) {
            $table->dropColumn(['identification', 'license_number', 'is_active']);
        });
    }
};
