<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lab_test_requests', function (Blueprint $table) {
            $table->enum('processing_mode', ['internal', 'referred'])->default('internal')->after('status');
            $table->foreignId('external_laboratory_id')
                ->nullable()
                ->after('processing_mode')
                ->constrained('external_laboratories')
                ->nullOnDelete();
            $table->string('external_reference_number')->nullable()->after('external_laboratory_id');
            $table->timestamp('sent_to_external_at')->nullable()->after('external_reference_number');
            $table->timestamp('expected_result_at')->nullable()->after('sent_to_external_at');
            $table->timestamp('external_result_received_at')->nullable()->after('expected_result_at');
            $table->timestamp('not_performed_at')->nullable()->after('external_result_received_at');
            $table->text('not_performed_reason')->nullable()->after('not_performed_at');
            $table->text('processing_notes')->nullable()->after('not_performed_reason');
            $table->string('external_report_path')->nullable()->after('processing_notes');
        });
    }

    public function down(): void
    {
        Schema::table('lab_test_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('external_laboratory_id');
            $table->dropColumn([
                'processing_mode',
                'external_reference_number',
                'sent_to_external_at',
                'expected_result_at',
                'external_result_received_at',
                'not_performed_at',
                'not_performed_reason',
                'processing_notes',
                'external_report_path',
            ]);
        });
    }
};
