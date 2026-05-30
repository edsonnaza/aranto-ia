<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_equipment_parameter_ranges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_equipment_id')->constrained('lab_equipments');
            $table->foreignId('lab_test_parameter_id')->constrained('lab_test_parameters');
            $table->decimal('min_value', 10, 2)->nullable();
            $table->decimal('max_value', 10, 2)->nullable();
            $table->decimal('expected_value', 10, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('lab_equipment_parameter_ranges');
    }
};