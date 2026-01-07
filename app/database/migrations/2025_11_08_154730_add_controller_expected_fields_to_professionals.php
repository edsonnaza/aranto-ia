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
            // Add fields expected by ProfessionalController only if they don't exist
            if (!Schema::hasColumn('professionals', 'identification')) {
                $table->string('identification', 20)->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('professionals', 'license_number')) {
                $table->string('license_number', 50)->nullable()->after('professional_license');
            }
            if (!Schema::hasColumn('professionals', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('status');
            }
        });

        // Populate new fields with existing data (only if they were created)
        if (Schema::hasColumn('professionals', 'identification')) {
            DB::statement('UPDATE professionals SET identification = document_number WHERE identification IS NULL');
        }
        if (Schema::hasColumn('professionals', 'license_number')) {
            DB::statement('UPDATE professionals SET license_number = professional_license WHERE license_number IS NULL');
        }
        if (Schema::hasColumn('professionals', 'is_active')) {
            DB::statement('UPDATE professionals SET is_active = CASE WHEN status = "active" THEN 1 ELSE 0 END WHERE is_active = 0');
        }
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
