<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('professionals', function (Blueprint $table) {
            $table->string('signature_path', 500)->nullable()->after('title');
            $table->string('stamp_path', 500)->nullable()->after('signature_path');
        });

        Schema::table('lab_reports', function (Blueprint $table) {
            $table->foreignId('signed_by_professional_id')
                ->nullable()
                ->after('generated_by')
                ->constrained('professionals');
        });
    }

    public function down(): void
    {
        Schema::table('lab_reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('signed_by_professional_id');
        });

        Schema::table('professionals', function (Blueprint $table) {
            $table->dropColumn(['signature_path', 'stamp_path']);
        });
    }
};
