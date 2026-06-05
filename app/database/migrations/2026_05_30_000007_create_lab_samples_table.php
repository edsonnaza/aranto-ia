<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_samples', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_detail_id')->constrained('service_request_details');
            $table->string('sample_number', 50);
            $table->string('sample_type', 100)->nullable();
            $table->dateTime('collected_at')->nullable();
            $table->dateTime('received_at')->nullable();
            $table->foreignId('received_by')->nullable()->constrained('users');
            $table->enum('status', [
                'pending',
                'pending_collection',
                'collected',
                'received',
                'processing',
                'in_analysis',
                'pending_validation',
                'validated',
                'completed',
                'reported',
                'rejected',
                'cancelled',
            ]);
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('lab_samples');
    }
};