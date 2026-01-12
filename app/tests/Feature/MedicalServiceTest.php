<?php

namespace Tests\Feature;

use App\Models\MedicalService;
use App\Models\ServiceCategory;
use App\Models\ServicePrice;
use App\Models\InsuranceType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MedicalServiceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test: Crear un servicio médico
     */
    public function test_can_create_medical_service()
    {
        $category = ServiceCategory::factory()->create();

        $service = MedicalService::create([
            'name' => 'Consulta General',
            'code' => 'CON-001',
            'description' => 'Consulta médica general',
            'category_id' => $category->id,
            'duration_minutes' => 30,
            'requires_appointment' => true,
            'requires_preparation' => false,
            'default_commission_percentage' => 15.00,
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('medical_services', [
            'id' => $service->id,
            'name' => 'Consulta General',
            'code' => 'CON-001',
            'status' => 'active',
        ]);
    }

    /**
     * Test: Actualizar un servicio médico
     */
    public function test_can_update_medical_service()
    {
        $service = MedicalService::factory()->create([
            'name' => 'Consulta General',
            'description' => 'Descripción antigua',
        ]);

        $service->update([
            'name' => 'Consulta Médica General',
            'description' => 'Consulta médica general completa',
            'duration_minutes' => 45,
        ]);

        $this->assertDatabaseHas('medical_services', [
            'id' => $service->id,
            'name' => 'Consulta Médica General',
            'description' => 'Consulta médica general completa',
            'duration_minutes' => 45,
        ]);
    }

    /**
     * Test: Obtener un servicio por ID
     */
    public function test_can_retrieve_medical_service()
    {
        $service = MedicalService::factory()->create([
            'name' => 'Radiografía de Tórax',
        ]);

        $retrieved = MedicalService::find($service->id);

        $this->assertEquals($service->id, $retrieved->id);
        $this->assertEquals('Radiografía de Tórax', $retrieved->name);
    }

    /**
     * Test: Eliminar un servicio médico
     */
    public function test_can_delete_medical_service()
    {
        $service = MedicalService::factory()->create();
        $serviceId = $service->id;

        $service->delete();

        $this->assertDatabaseMissing('medical_services', [
            'id' => $serviceId,
        ]);
    }

    /**
     * Test: Marcar un servicio como inactivo (soft delete)
     */
    public function test_can_mark_service_as_inactive()
    {
        $service = MedicalService::factory()->create([
            'status' => 'active',
        ]);

        $service->update(['status' => 'inactive']);

        $this->assertDatabaseHas('medical_services', [
            'id' => $service->id,
            'status' => 'inactive',
        ]);
    }

    /**
     * Test: Un servicio pertenece a una categoría
     */
    public function test_medical_service_belongs_to_category()
    {
        $category = ServiceCategory::factory()->create([
            'name' => 'Imagenología',
        ]);

        $service = MedicalService::factory()->withCategory($category)->create();

        $this->assertEquals($category->id, $service->category_id);
        $this->assertInstanceOf(ServiceCategory::class, $service->category);
        $this->assertEquals('Imagenología', $service->category->name);
    }

    /**
     * Test: Obtener servicios activos por scope
     */
    public function test_can_filter_active_services()
    {
        MedicalService::factory(3)->create(['status' => 'active']);
        MedicalService::factory(2)->create(['status' => 'inactive']);

        $activeServices = MedicalService::active()->get();

        $this->assertEquals(3, $activeServices->count());
        $this->assertTrue($activeServices->every(fn ($service) => $service->status === 'active'));
    }

    /**
     * Test: Filtrar servicios por categoría
     */
    public function test_can_filter_services_by_category()
    {
        $category1 = ServiceCategory::factory()->create();
        $category2 = ServiceCategory::factory()->create();

        MedicalService::factory(3)->withCategory($category1)->create();
        MedicalService::factory(2)->withCategory($category2)->create();

        $servicesInCategory = MedicalService::byCategory($category1->id)->get();

        $this->assertEquals(3, $servicesInCategory->count());
        $this->assertTrue($servicesInCategory->every(fn ($service) => $service->category_id === $category1->id));
    }

    /**
     * Test: Filtrar servicios que requieren cita
     */
    public function test_can_filter_services_requiring_appointment()
    {
        MedicalService::factory(3)->requiresAppointment()->create();
        MedicalService::factory(2)->withoutAppointment()->create();

        $appointmentServices = MedicalService::where('requires_appointment', true)->get();

        $this->assertEquals(3, $appointmentServices->count());
        $this->assertTrue($appointmentServices->every(fn ($service) => $service->requires_appointment === true));
    }

    /**
     * Test: Obtener información de servicio completa (con categoría)
     */
    public function test_can_get_complete_service_information()
    {
        $category = ServiceCategory::factory()->create([
            'name' => 'Laboratorio',
        ]);

        $service = MedicalService::factory()
            ->withCategory($category)
            ->create([
                'name' => 'Análisis de Sangre Completo',
                'duration_minutes' => 15,
                'requires_appointment' => true,
                'default_commission_percentage' => 20.00,
            ]);

        $service = $service->fresh(['category']);

        $this->assertEquals('Análisis de Sangre Completo', $service->name);
        $this->assertEquals(15, $service->duration_minutes);
        $this->assertTrue($service->requires_appointment);
        $this->assertEquals(20.00, $service->default_commission_percentage);
        $this->assertEquals('Laboratorio', $service->category->name);
    }

    /**
     * Test: Calcular comisión con porcentaje por defecto
     */
    public function test_can_calculate_default_commission()
    {
        $service = MedicalService::factory()->create([
            'default_commission_percentage' => 15.00,
        ]);

        $servicePrice = 100000; // ₲100.000
        $commission = $service->calculateCommission($servicePrice);

        $this->assertEquals(15000, $commission); // ₲15.000
    }

    /**
     * Test: Calcular comisión con porcentaje personalizado
     */
    public function test_can_calculate_custom_commission()
    {
        $service = MedicalService::factory()->create([
            'default_commission_percentage' => 15.00,
        ]);

        $servicePrice = 100000; // ₲100.000
        $customPercentage = 20.00;
        $commission = $service->calculateCommission($servicePrice, $customPercentage);

        $this->assertEquals(20000, $commission); // ₲20.000
    }

    /**
     * Test: Obtener duración formateada
     */
    public function test_can_get_formatted_duration()
    {
        $service30min = MedicalService::factory()->create(['duration_minutes' => 30]);
        $service60min = MedicalService::factory()->create(['duration_minutes' => 60]);
        $service90min = MedicalService::factory()->create(['duration_minutes' => 90]);

        $this->assertEquals('30 minutos', $service30min->formatted_duration);
        $this->assertEquals('1 hora', $service60min->formatted_duration);
        $this->assertEquals('1h 30m', $service90min->formatted_duration);
    }

    /**
     * Test: Servicio con instrucciones de preparación
     */
    public function test_service_with_preparation_instructions()
    {
        $service = MedicalService::factory()
            ->requiresPreparation()
            ->create([
                'name' => 'Ecografía Abdominal',
                'preparation_instructions' => 'Ayuno de 6 horas antes del procedimiento',
            ]);

        $this->assertTrue($service->requires_preparation);
        $this->assertNotNull($service->preparation_instructions);
        $this->assertStringContainsString('Ayuno', $service->preparation_instructions);
    }

    /**
     * Test: Validar métodos booleanos
     */
    public function test_service_boolean_methods()
    {
        $activeService = MedicalService::factory()->create(['status' => 'active']);
        $inactiveService = MedicalService::factory()->create(['status' => 'inactive']);

        $this->assertTrue($activeService->isActive());
        $this->assertFalse($inactiveService->isActive());

        $appointmentService = MedicalService::factory()->requiresAppointment()->create();
        $noAppointmentService = MedicalService::factory()->withoutAppointment()->create();

        $this->assertTrue($appointmentService->requiresAppointment());
        $this->assertFalse($noAppointmentService->requiresAppointment());

        $prepService = MedicalService::factory()->requiresPreparation()->create();
        $noPrepService = MedicalService::factory()->create(['requires_preparation' => false]);

        $this->assertTrue($prepService->requiresPreparation());
        $this->assertFalse($noPrepService->requiresPreparation());
    }

    /**
     * Test: Un servicio puede tener múltiples precios (por tipo de seguro)
     */
    public function test_medical_service_can_have_multiple_prices()
    {
        $service = MedicalService::factory()->create();

        // Crear precios para diferentes tipos de seguros
        $insurances = InsuranceType::factory(3)->create();

        foreach ($insurances as $insurance) {
            ServicePrice::create([
                'service_id' => $service->id,
                'insurance_type_id' => $insurance->id,
                'price' => 50000, // ₲50.000
                'effective_from' => now()->toDateString(),
            ]);
        }

        $service = $service->fresh();
        $prices = $service->servicePrices;

        $this->assertEquals(3, $prices->count());
    }
}
