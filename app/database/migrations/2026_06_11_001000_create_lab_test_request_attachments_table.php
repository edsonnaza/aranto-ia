<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_test_request_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_test_request_id')->constrained('lab_test_requests')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('original_name')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('kind', 50)->default('external_result');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        $legacyAttachments = DB::table('lab_test_requests')
            ->whereNotNull('external_report_path')
            ->select([
                'id',
                'external_report_path',
                'updated_at',
            ])
            ->get();

        foreach ($legacyAttachments as $attachment) {
            DB::table('lab_test_request_attachments')->insert([
                'lab_test_request_id' => $attachment->id,
                'file_path' => $attachment->external_report_path,
                'original_name' => basename((string) $attachment->external_report_path),
                'mime_type' => null,
                'file_size' => null,
                'kind' => 'external_result',
                'uploaded_by' => null,
                'created_at' => $attachment->updated_at ?? now(),
                'updated_at' => $attachment->updated_at ?? now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_test_request_attachments');
    }
};
