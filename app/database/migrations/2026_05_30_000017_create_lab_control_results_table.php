<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_control_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_control_test_id')->constrained('lab_control_tests');
            $table->string('parameter_name', 200);
            $table->string('value', 100);
            $table->boolean('within_range')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('lab_control_results');
    }
};