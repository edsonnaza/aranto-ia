<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE lab_test_requests
            MODIFY COLUMN status ENUM(
                'pending',
                'assigned',
                'in_process',
                'completed',
                'rejected',
                'cancelled',
                'referred_pending',
                'referred_sent',
                'external_result_received',
                'not_performed'
            ) NOT NULL DEFAULT 'pending'
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE lab_test_requests
            MODIFY COLUMN status ENUM(
                'pending',
                'in_process',
                'completed',
                'rejected'
            ) NOT NULL DEFAULT 'pending'
        ");
    }
};
