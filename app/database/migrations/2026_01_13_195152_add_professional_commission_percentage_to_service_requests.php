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
        Schema::table('service_request_details', function (Blueprint $table) {
            $table->decimal('professional_commission_percentage', 5, 2)
                ->nullable()
                ->after('professional_id')
                ->comment('Porcentaje de comisión del profesional en el momento de crear la solicitud');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_request_details', function (Blueprint $table) {
            $table->dropColumn('professional_commission_percentage');
        });
    }
};
