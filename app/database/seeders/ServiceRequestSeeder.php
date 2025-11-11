<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\ServiceRequest;
use App\Models\ServiceRequestDetail;
use App\Models\Patient;
use App\Models\User;
use App\Models\MedicalService;
use App\Models\Professional;
use App\Models\InsuranceType;

class ServiceRequestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Verificar que existan los datos necesarios
        $patient = Patient::first();
        $user = User::first();
        $service = MedicalService::first();
        $professional = Professional::first();
        $insurance = InsuranceType::first();

        if (!$patient || !$user || !$service || !$professional || !$insurance) {
            $this->command->warn('Faltan datos requeridos. Asegúrate de tener pacientes, usuarios, servicios, profesionales y tipos de seguro.');
            return;
        }

        // Crear solicitud de servicio de ejemplo
        $serviceRequest = ServiceRequest::create([
            'patient_id' => $patient->id,
            'created_by' => $user->id,
            'request_date' => now()->toDateString(),
            'request_time' => '14:30:00',
            'status' => ServiceRequest::STATUS_PENDING_CONFIRMATION,
            'reception_type' => ServiceRequest::RECEPTION_WALK_IN,
            'priority' => ServiceRequest::PRIORITY_NORMAL,
            'notes' => 'Paciente walk-in, requiere atención general',
            'total_amount' => 0, // Se calculará automáticamente
            'paid_amount' => 0,
            'payment_status' => ServiceRequest::PAYMENT_PENDING,
        ]);

        // Crear detalle de servicio
        ServiceRequestDetail::create([
            'service_request_id' => $serviceRequest->id,
            'medical_service_id' => $service->id,
            'professional_id' => $professional->id,
            'scheduled_date' => now()->addDay()->toDateString(),
            'scheduled_time' => '15:00:00',
            'estimated_duration' => 30,
            'insurance_type_id' => $insurance->id,
            'unit_price' => 180000, // ₲ 180.000
            'quantity' => 1,
            'discount_percentage' => 0,
            'discount_amount' => 0,
            'status' => ServiceRequestDetail::STATUS_PENDING,
            'preparation_instructions' => 'Traer estudios previos si los tiene',
            'notes' => 'Consulta general de rutina',
        ]);

        $this->command->info('Seeder de ServiceRequest ejecutado exitosamente.');
    }
}
