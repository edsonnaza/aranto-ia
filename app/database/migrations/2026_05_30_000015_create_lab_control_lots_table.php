<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_control_lots', function (Blueprint $table) {
            $table->id();
            $table->string('lot_number', 100);
            $table->date('expiration_date');
            $table->foreignId('equipment_id')->constrained('lab_equipments');
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('lab_control_lots');
    }
};