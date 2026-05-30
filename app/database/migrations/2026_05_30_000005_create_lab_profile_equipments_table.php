<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_profile_equipments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_test_profile_id')->constrained('lab_test_profiles');
            $table->foreignId('lab_equipment_id')->constrained('lab_equipments');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('lab_profile_equipments');
    }
};