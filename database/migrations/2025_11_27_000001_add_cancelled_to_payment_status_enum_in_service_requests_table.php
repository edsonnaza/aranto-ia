<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->enum('payment_status', ['pending', 'partial', 'paid', 'cancelled'])
                ->default('pending')
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->enum('payment_status', ['pending', 'partial', 'paid'])
                ->default('pending')
                ->change();
        });
    }
};
