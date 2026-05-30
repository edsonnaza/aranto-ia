<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_sample_id')->constrained('lab_samples');
            $table->string('report_number', 50);
            $table->string('pdf_path', 500);
            $table->foreignId('generated_by')->constrained('users');
            $table->dateTime('generated_at');
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('lab_reports');
    }
};