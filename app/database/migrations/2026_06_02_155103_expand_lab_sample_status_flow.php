<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE lab_samples MODIFY COLUMN status ENUM(
            'pending',
            'pending_collection',
            'collected',
            'received',
            'processing',
            'in_analysis',
            'pending_validation',
            'validated',
            'completed',
            'reported',
            'rejected',
            'cancelled'
        ) NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE lab_samples MODIFY COLUMN status ENUM(
            'pending',
            'received',
            'processing',
            'completed',
            'rejected'
        ) NOT NULL");
    }
};
