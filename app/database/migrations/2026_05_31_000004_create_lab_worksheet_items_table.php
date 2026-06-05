<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_worksheet_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_worksheet_id')->constrained('lab_worksheets');
            $table->foreignId('lab_test_request_id')->constrained('lab_test_requests');
            $table->integer('position')->default(0); // Orden en la worksheet
            $table->enum('status', ['pending', 'processing', 'completed'])->default('pending');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_worksheet_items');
    }
};
