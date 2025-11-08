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
            $table->string('identification', 20)->nullable()->after('user_id'); // Maps to document_number
            $table->string('specialty', 100)->after('title'); // New specialty field
            $table->string('license_number', 50)->nullable()->after('specialty'); // Maps to professional_license
            $table->boolean('is_active')->default(true)->after('license_number'); // Maps to status
        });

        // Update existing data to match new structure
        DB::statement('UPDATE professionals SET identification = document_number');
        DB::statement('UPDATE professionals SET license_number = professional_license');
        DB::statement('UPDATE professionals SET is_active = CASE WHEN status = "active" THEN 1 ELSE 0 END');
        DB::statement('UPDATE professionals SET specialty = COALESCE(title, "General")');
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
