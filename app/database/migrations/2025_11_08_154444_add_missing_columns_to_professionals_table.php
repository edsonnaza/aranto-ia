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
            // Renaming/adding missing columns that ProfessionalController expects
            if (!Schema::hasColumn('professionals', 'identification')) {
                $table->string('identification', 20)->nullable()->after('user_id'); // Maps to document_number
            }
            if (!Schema::hasColumn('professionals', 'specialty')) {
                $table->string('specialty', 100)->nullable()->after('title'); // New specialty field
            }
            if (!Schema::hasColumn('professionals', 'license_number')) {
                $table->string('license_number', 50)->nullable()->after('specialty'); // Maps to professional_license
            }
            if (!Schema::hasColumn('professionals', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('license_number'); // Maps to status
            }
        });

        // Update existing data to match new structure
        DB::statement('UPDATE professionals SET identification = document_number WHERE identification IS NULL');
        DB::statement('UPDATE professionals SET license_number = professional_license WHERE license_number IS NULL');
        DB::statement('UPDATE professionals SET is_active = CASE WHEN status = "active" THEN 1 ELSE 0 END WHERE is_active = 0 AND status != "inactive"');
        DB::statement('UPDATE professionals SET specialty = COALESCE(title, NULL) WHERE specialty IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('professionals', function (Blueprint $table) {
            $table->dropColumn(['identification', 'specialty', 'license_number', 'is_active']);
        });
    }
};
