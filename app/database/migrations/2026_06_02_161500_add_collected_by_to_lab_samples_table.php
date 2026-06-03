<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lab_samples', function (Blueprint $table) {
            $table->foreignId('collected_by')
                ->nullable()
                ->after('collected_at')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lab_samples', function (Blueprint $table) {
            $table->dropForeign(['collected_by']);
            $table->dropColumn('collected_by');
        });
    }
};
