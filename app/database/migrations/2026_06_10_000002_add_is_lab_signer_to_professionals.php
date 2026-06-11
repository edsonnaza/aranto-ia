<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('professionals', function (Blueprint $table) {
            $table->boolean('is_lab_signer')->default(false)->after('stamp_path');
        });
    }

    public function down(): void
    {
        Schema::table('professionals', function (Blueprint $table) {
            $table->dropColumn('is_lab_signer');
        });
    }
};
