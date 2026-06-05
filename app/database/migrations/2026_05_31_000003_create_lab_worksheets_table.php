<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_worksheets', function (Blueprint $table) {
            $table->id();
            $table->string('worksheet_number', 50)->unique();
            $table->date('worksheet_date');
            $table->foreignId('lab_equipment_id')->nullable()->constrained('lab_equipments');
            $table->foreignId('technician_id')->nullable()->constrained('users');
            $table->enum('status', ['draft', 'in_progress', 'completed', 'cancelled'])->default('draft');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_worksheets');
    }
};
