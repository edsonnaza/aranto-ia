<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_request_details', function (Blueprint $table) {
            $table->dropForeign(['professional_id']);
        });

        Schema::table('service_request_details', function (Blueprint $table) {
            $table->unsignedBigInteger('professional_id')->nullable()->change();
            $table->foreign('professional_id')->references('id')->on('professionals');
        });
    }

    public function down(): void
    {
        $fallbackProfessionalId = DB::table('professionals')->orderBy('id')->value('id');

        if (! $fallbackProfessionalId) {
            throw new RuntimeException('No hay profesionales para restaurar professional_id como obligatorio.');
        }

        DB::table('service_request_details')
            ->whereNull('professional_id')
            ->update(['professional_id' => $fallbackProfessionalId]);

        Schema::table('service_request_details', function (Blueprint $table) {
            $table->dropForeign(['professional_id']);
        });

        Schema::table('service_request_details', function (Blueprint $table) {
            $table->unsignedBigInteger('professional_id')->nullable(false)->change();
            $table->foreign('professional_id')->references('id')->on('professionals');
        });
    }
};
