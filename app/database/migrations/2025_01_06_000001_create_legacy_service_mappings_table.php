<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('legacy_service_mappings', function (Blueprint $table) {
            $table->id();
            $table->integer('legacy_product_id')->unique()->comment('ID del producto en tabla legacy.producto');
            $table->foreignId('service_id')->constrained('services')->onDelete('cascade')->comment('ID del servicio en tabla services');
            $table->string('legacy_name')->comment('Nombre del producto en legacy (snapshot)');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legacy_service_mappings');
    }
};
