<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professional_id')->constrained('professionals')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('medical_service_id')->nullable()->constrained('medical_services')->nullOnDelete();
            $table->foreignId('service_request_id')->nullable()->constrained('service_requests')->nullOnDelete();
            $table->date('appointment_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedInteger('duration_minutes')->default(30);
            $table->enum('status', ['scheduled', 'checked_in', 'completed', 'cancelled', 'no_show'])->default('scheduled');
            $table->enum('source', ['agenda', 'reception', 'manual'])->default('agenda');
            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->dateTime('checked_in_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['professional_id', 'appointment_date'], 'sa_prof_date_idx');
            $table->index(['patient_id', 'appointment_date'], 'sa_patient_date_idx');
            $table->index(['status', 'appointment_date'], 'sa_status_date_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_appointments');
    }
};