<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lab_test_requests', function (Blueprint $table) {
            $table->boolean('include_external_attachments_in_medical_history')
                ->default(false)
                ->after('processing_notes');
        });

        Schema::table('lab_test_request_attachments', function (Blueprint $table) {
            $table->foreignId('medical_record_file_id')
                ->nullable()
                ->after('uploaded_by')
                ->constrained('medical_record_files')
                ->nullOnDelete();
            $table->timestamp('copied_to_medical_history_at')
                ->nullable()
                ->after('medical_record_file_id');
        });

        Schema::table('lab_reports', function (Blueprint $table) {
            $table->foreignId('medical_record_id')
                ->nullable()
                ->after('signed_by_professional_id')
                ->constrained('medical_records')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lab_reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('medical_record_id');
        });

        Schema::table('lab_test_request_attachments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('medical_record_file_id');
            $table->dropColumn('copied_to_medical_history_at');
        });

        Schema::table('lab_test_requests', function (Blueprint $table) {
            $table->dropColumn('include_external_attachments_in_medical_history');
        });
    }
};
