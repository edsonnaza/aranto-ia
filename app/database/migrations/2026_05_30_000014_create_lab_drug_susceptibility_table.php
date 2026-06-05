<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_drug_susceptibility', function (Blueprint $table) {
            $table->id();
            $table->foreignId('isolated_organism_id')->constrained('lab_isolated_organisms');
            $table->foreignId('lab_drug_id')->constrained('lab_drugs');
            $table->enum('result', ['S', 'I', 'R']);
            $table->string('zone', 20)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('lab_drug_susceptibility');
    }
};