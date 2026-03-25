<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('professional_schedule_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professional_id')->constrained('professionals')->cascadeOnDelete();
            $table->enum('block_type', ['travel', 'conference', 'holiday', 'vacation', 'other']);
            $table->string('title', 120);
            $table->dateTime('start_datetime');
            $table->dateTime('end_datetime');
            $table->boolean('affects_full_day')->default(false);
            $table->enum('status', ['active', 'cancelled'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['professional_id', 'status'], 'psb_prof_status_idx');
            $table->index(['start_datetime', 'end_datetime'], 'psb_datetime_range_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('professional_schedule_blocks');
    }
};