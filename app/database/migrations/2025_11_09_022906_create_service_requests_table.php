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
        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();
            
            // Referencias principales
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('created_by')->constrained('users');
            
            // Información de la solicitud
            $table->string('request_number', 20)->unique(); // Ej: REQ-2025-001234
            $table->date('request_date');
            $table->time('request_time')->nullable();
            
            // Estado del proceso
            $table->enum('status', [
                'pending_confirmation',
                'confirmed', 
                'in_progress',
                'pending_payment',
                'paid',
                'cancelled'
            ])->default('pending_confirmation');
            
            // Tipo de recepción
            $table->enum('reception_type', [
                'scheduled',
                'walk_in', 
                'emergency',
                'inpatient_discharge'
            ]);
            
            // Observaciones
            $table->text('notes')->nullable();
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            
            // Control de pago
            $table->decimal('total_amount', 12, 2);
            $table->decimal('paid_amount', 12, 2)->default(0.00);
            $table->enum('payment_status', ['pending', 'partial', 'paid'])->default('pending');
            
            // Control de estado
            $table->datetime('confirmed_at')->nullable();
            $table->datetime('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users');
            $table->text('cancellation_reason')->nullable();
            
            $table->timestamps();
            
            // Índices
            $table->index(['patient_id']);
            $table->index(['status']);
            $table->index(['payment_status']);
            $table->index(['request_date']);
            $table->index(['reception_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_requests');
    }
};
