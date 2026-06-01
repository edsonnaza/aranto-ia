<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lab_samples', function (Blueprint $table) {
            // Cambiar sample_type string por FK
            $table->dropColumn('sample_type');
            
            // Agregar nuevos campos
            $table->foreignId('lab_sample_type_id')->nullable()->after('sample_number')->constrained('lab_sample_types');
            $table->foreignId('patient_id')->after('service_request_detail_id')->constrained('patients');
            $table->string('barcode', 100)->nullable()->after('sample_number');
        });
    }

    public function down(): void
    {
        Schema::table('lab_samples', function (Blueprint $table) {
            $table->dropForeign(['lab_sample_type_id']);
            $table->dropForeign(['patient_id']);
            $table->dropColumn(['lab_sample_type_id', 'patient_id', 'barcode']);
            
            $table->string('sample_type', 100)->nullable()->after('sample_number');
        });
    }
};
