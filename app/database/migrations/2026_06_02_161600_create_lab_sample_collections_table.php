<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_sample_collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_sample_id')->constrained('lab_samples')->cascadeOnDelete();
            $table->foreignId('collected_by')->constrained('users');
            $table->dateTime('collected_at');

            $table->string('sample_type', 100)->nullable();
            $table->string('container_type', 100)->nullable();
            $table->decimal('volume', 10, 2)->nullable();
            $table->string('volume_unit', 20)->nullable();
            $table->string('sample_condition', 50)->nullable();
            $table->string('collection_site', 100)->nullable();
            $table->text('collection_notes')->nullable();

            $table->timestamps();

            $table->index(['lab_sample_id', 'collected_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_sample_collections');
    }
};
