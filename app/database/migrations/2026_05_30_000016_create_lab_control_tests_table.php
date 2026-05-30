<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_control_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')->constrained('lab_equipments');
            $table->foreignId('performed_by')->constrained('users');
            $table->dateTime('performed_at');
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('lab_control_tests');
    }
};