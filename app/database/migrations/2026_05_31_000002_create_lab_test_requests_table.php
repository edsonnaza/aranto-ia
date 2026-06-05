<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_test_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_sample_id')->constrained('lab_samples');
            $table->foreignId('lab_test_profile_id')->constrained('lab_test_profiles');
            $table->foreignId('requested_by')->constrained('users'); // Médico solicitante
            $table->enum('priority', ['routine', 'urgent', 'stat'])->default('routine');
            $table->enum('status', ['pending', 'in_process', 'completed', 'rejected'])->default('pending');
            $table->foreignId('assigned_to')->nullable()->constrained('users'); // Técnico asignado
            $table->dateTime('started_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_test_requests');
    }
};
