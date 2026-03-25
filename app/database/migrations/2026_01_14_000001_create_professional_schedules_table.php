<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('professional_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professional_id')->constrained('professionals')->cascadeOnDelete();
            $table->string('name', 120);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->unsignedInteger('slot_duration_minutes')->default(30);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['professional_id', 'status'], 'ps_prof_status_idx');
            $table->index(['start_date', 'end_date'], 'ps_date_range_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('professional_schedules');
    }
};