<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('transactions')) {
            return;
        }

        // Use raw SQL to avoid requiring doctrine/dbal for change()
        try {
            DB::statement("ALTER TABLE `transactions` MODIFY `category` VARCHAR(50) NULL;");
        } catch (\Throwable $e) {
            // Log or ignore if DB does not support the statement in this environment
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('transactions')) {
            return;
        }

        try {
            DB::statement("ALTER TABLE `transactions` MODIFY `category` VARCHAR(20) NULL;");
        } catch (\Throwable $e) {
            // ignore
        }
    }
};
