<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('schedule_appointments', function (Blueprint $table) {
            $table->foreignId('professional_schedule_id')
                ->nullable()
                ->after('professional_id')
                ->constrained('professional_schedules')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('schedule_appointments', function (Blueprint $table) {
            $table->dropForeign(['professional_schedule_id']);
            $table->dropColumn('professional_schedule_id');
        });
    }
};
