<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('professional_schedule_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professional_schedule_id')->constrained('professional_schedules')->cascadeOnDelete();
            $table->unsignedTinyInteger('weekday');
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedTinyInteger('capacity')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['professional_schedule_id', 'weekday'], 'psr_sched_weekday_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('professional_schedule_rules');
    }
};