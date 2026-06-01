<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lab_results', function (Blueprint $table) {
            $table->foreignId('lab_test_request_id')->nullable()->after('lab_sample_id')->constrained('lab_test_requests');
        });
    }

    public function down(): void
    {
        Schema::table('lab_results', function (Blueprint $table) {
            $table->dropForeign(['lab_test_request_id']);
            $table->dropColumn('lab_test_request_id');
        });
    }
};
