<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('auditable_type'); // Model class name
            $table->unsignedBigInteger('auditable_id'); // Model ID
            $table->string('event'); // created, updated, deleted
            $table->json('old_values')->nullable(); // Previous values
            $table->json('new_values')->nullable(); // New values
            $table->unsignedBigInteger('user_id')->nullable(); // User who made the change
            $table->string('user_agent')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['auditable_type', 'auditable_id'], 'idx_audit_logs_auditable');
            $table->index('event', 'idx_audit_logs_event');
            $table->index('user_id', 'idx_audit_logs_user');
            $table->index('created_at', 'idx_audit_logs_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
