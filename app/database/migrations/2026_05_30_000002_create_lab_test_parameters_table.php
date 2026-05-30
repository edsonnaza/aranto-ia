<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_test_parameters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_test_profile_id')->constrained('lab_test_profiles');
            $table->string('name', 200);
            $table->string('code', 50);
            $table->string('unit', 50)->nullable();
            $table->integer('display_order')->default(0);
            $table->enum('parameter_type', ['numeric', 'text', 'option', 'calculated']);
            $table->boolean('is_required')->default(true);
            $table->text('formula')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('lab_test_parameters');
    }
};