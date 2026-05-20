<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add called/started/finished timestamps
        Schema::table('consultation_queue', function (Blueprint $table) {
            $table->timestamp('called_at')->nullable()->after('status');
            $table->timestamp('started_at')->nullable()->after('called_at');
            $table->timestamp('finished_at')->nullable()->after('started_at');
        });

        // Map existing numeric priority to enum labels and convert column type
        // 0 or NULL -> 'normal', >0 -> 'urgent'
        DB::statement("UPDATE consultation_queue SET priority = CASE WHEN COALESCE(priority,0) > 0 THEN 'urgent' ELSE 'normal' END");

        // Convert the priority column to ENUM('normal','urgent') with default 'normal'
        DB::statement("ALTER TABLE consultation_queue MODIFY COLUMN priority ENUM('normal','urgent') NOT NULL DEFAULT 'normal'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert priority back to integer (urgent -> 1, normal -> 0)
        DB::statement("UPDATE consultation_queue SET priority = CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END");
        DB::statement("ALTER TABLE consultation_queue MODIFY COLUMN priority TINYINT NOT NULL DEFAULT 0");

        Schema::table('consultation_queue', function (Blueprint $table) {
            $table->dropColumn(['called_at', 'started_at', 'finished_at']);
        });
    }
};
