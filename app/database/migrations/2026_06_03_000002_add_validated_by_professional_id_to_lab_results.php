<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lab_results', function (Blueprint $table) {
            $table->foreignId('validated_by_professional_id')
                ->nullable()
                ->after('equipment_id')
                ->constrained('professionals');
        });

        Schema::table('lab_validations', function (Blueprint $table) {
            $table->foreignId('validated_by_professional_id')
                ->nullable()
                ->after('id')
                ->constrained('professionals');
        });
    }

    public function down(): void
    {
        Schema::table('lab_results', function (Blueprint $table) {
            $table->dropForeignIdFor('validated_by_professional_id');
            $table->dropColumn('validated_by_professional_id');
        });

        Schema::table('lab_validations', function (Blueprint $table) {
            $table->dropForeignIdFor('validated_by_professional_id');
            $table->dropColumn('validated_by_professional_id');
        });
    }
};
