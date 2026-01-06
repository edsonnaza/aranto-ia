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
        Schema::create('professional_commission_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professional_id')->unique()->constrained('professionals')->onDelete('cascade');
            $table->decimal('commission_percentage', 5, 2); // Percentage for this professional
            $table->timestamps();
            
            $table->index('professional_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('professional_commission_settings');
    }
};
