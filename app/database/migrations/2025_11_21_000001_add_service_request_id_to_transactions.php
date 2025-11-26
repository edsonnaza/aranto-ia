<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('transactions')) {
            return;
        }

        Schema::table('transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('transactions', 'service_request_id')) {
                $table->unsignedBigInteger('service_request_id')->nullable()->after('id')->index();
                // add foreign key if service_requests table exists
                if (Schema::hasTable('service_requests')) {
                    $table->foreign('service_request_id')->references('id')->on('service_requests')->nullOnDelete();
                }
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('transactions')) {
            return;
        }

        Schema::table('transactions', function (Blueprint $table) {
            if (Schema::hasColumn('transactions', 'service_request_id')) {
                // drop foreign if exists
                try {
                    $table->dropForeign(['service_request_id']);
                } catch (\Throwable $e) {
                    // ignore if constraint not present
                }
                $table->dropColumn('service_request_id');
            }
        });
    }
};
