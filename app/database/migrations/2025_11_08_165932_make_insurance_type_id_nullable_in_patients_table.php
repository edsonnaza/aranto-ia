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
        Schema::table('patients', function (Blueprint $table) {
            // Drop the foreign key constraint first
            $table->dropForeign(['insurance_type_id']);
            
            // Modify the column to be nullable
            $table->unsignedBigInteger('insurance_type_id')->nullable()->change();
            
            // Re-add the foreign key constraint
            $table->foreign('insurance_type_id')->references('id')->on('insurance_types');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            // Drop the foreign key constraint
            $table->dropForeign(['insurance_type_id']);
            
            // Modify the column to be NOT NULL
            $table->unsignedBigInteger('insurance_type_id')->nullable(false)->change();
            
            // Re-add the foreign key constraint
            $table->foreign('insurance_type_id')->references('id')->on('insurance_types');
        });
    }
};
