<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vital_signs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('medical_record_id')->nullable()->constrained('medical_records')->nullOnDelete();

            // Measurable fields (nullable because measurements may be absent)
            $table->decimal('temperature', 5, 2)->nullable()->comment('Celsius');
            $table->unsignedSmallInteger('pulse')->nullable()->comment('beats per minute');
            $table->unsignedTinyInteger('spo2')->nullable()->comment('percentage 0-100');
            $table->unsignedSmallInteger('respiratory_rate')->nullable()->comment('breaths per minute');

            // Store BP split for querying; keep textual copy if needed
            $table->unsignedSmallInteger('bp_systolic')->nullable();
            $table->unsignedSmallInteger('bp_diastolic')->nullable();
            $table->string('blood_pressure', 16)->nullable()->comment('optional human-readable like 120/80');

            // Optional recorded time (may differ from created_at if imported or measured earlier)
            $table->timestamp('recorded_at')->nullable();

            $table->timestamps();

            // Indexes for common queries (patient timeline, latest per patient)
            $table->index(['patient_id', 'recorded_at']);
            $table->index(['patient_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vital_signs');
    }
};
