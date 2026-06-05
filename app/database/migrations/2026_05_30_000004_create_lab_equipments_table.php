<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_equipments', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200);
            $table->string('manufacturer', 200)->nullable();
            $table->string('model', 200)->nullable();
            $table->string('serial_number', 100)->nullable();
            $table->enum('status', ['active', 'maintenance', 'inactive']);
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('lab_equipments');
    }
};