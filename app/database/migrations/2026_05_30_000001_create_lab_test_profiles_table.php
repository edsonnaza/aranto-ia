<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_test_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medical_service_id')->constrained('medical_services');
            $table->string('name', 200);
            $table->string('code', 50);
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'inactive']);
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('lab_test_profiles');
    }
};