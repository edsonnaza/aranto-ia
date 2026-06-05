<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_sample_id')->constrained('lab_samples');
            $table->foreignId('lab_test_parameter_id')->constrained('lab_test_parameters');
            $table->foreignId('equipment_id')->nullable()->constrained('lab_equipments');
            $table->string('value', 255)->nullable();
            $table->decimal('calculated_percentage', 10, 2)->nullable();
            $table->boolean('is_out_of_range')->default(false);
            $table->enum('status', ['draft', 'validated']);
            $table->foreignId('entered_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('lab_results');
    }
};