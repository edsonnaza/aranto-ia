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
        Schema::create('service_request_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained('service_requests')->onDelete('cascade');
            
            // Servicio específico
            $table->foreignId('medical_service_id')->constrained('medical_services');
            $table->foreignId('professional_id')->constrained('professionals');
            
            // Programación
            $table->date('scheduled_date')->nullable();
            $table->time('scheduled_time')->nullable();
            $table->integer('estimated_duration')->default(30); // minutos
            
            // Pricing calculado en el momento
            $table->foreignId('insurance_type_id')->constrained('insurance_types');
            $table->decimal('unit_price', 10, 2); // Precio vigente al momento de crear
            $table->integer('quantity')->default(1);
            $table->decimal('subtotal', 10, 2); // unit_price * quantity
            $table->decimal('discount_percentage', 5, 2)->default(0.00);
            $table->decimal('discount_amount', 10, 2)->default(0.00);
            $table->decimal('total_amount', 10, 2); // subtotal - discount_amount
            
            // Estado específico de este servicio
            $table->enum('status', [
                'pending',
                'confirmed',
                'in_progress', 
                'completed',
                'cancelled'
            ])->default('pending');
            
            // Vinculación con pago (cuando se cobra)
            $table->bigInteger('movement_detail_id')->unsigned()->nullable(); // Se llena cuando se cobra en caja
            $table->datetime('paid_at')->nullable();
            
            // Observaciones específicas
            $table->text('preparation_instructions')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Índices
            $table->index(['service_request_id']);
            $table->index(['medical_service_id']);
            $table->index(['professional_id']);
            $table->index(['insurance_type_id']);
            $table->index(['status']);
            $table->index(['scheduled_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_request_details');
    }
};
