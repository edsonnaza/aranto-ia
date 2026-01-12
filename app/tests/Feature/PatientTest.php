<?php

namespace Tests\Feature;

use App\Models\Patient;
use App\Models\InsuranceType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PatientTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test: Crear un paciente
     */
    public function test_can_create_patient()
    {
        $patient = Patient::create([
            'document_type' => 'CI',
            'document_number' => '1234567',
            'first_name' => 'Juan',
            'last_name' => 'Pérez',
            'birth_date' => now()->subYears(40),
            'gender' => 'M',
            'phone' => '0961234567',
            'email' => 'juan@example.com',
            'address' => 'Calle Principal 123',
            'city' => 'Asunción',
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('patients', [
            'id' => $patient->id,
            'document_number' => '1234567',
            'first_name' => 'Juan',
            'last_name' => 'Pérez',
        ]);
    }

    /**
     * Test: Actualizar un paciente
     */
    public function test_can_update_patient()
    {
        $patient = Patient::factory()->create([
            'email' => 'old@example.com',
            'phone' => '0961111111',
        ]);

        $patient->update([
            'email' => 'new@example.com',
            'phone' => '0962222222',
        ]);

        $this->assertDatabaseHas('patients', [
            'id' => $patient->id,
            'email' => 'new@example.com',
            'phone' => '0962222222',
        ]);
    }

    /**
     * Test: Obtener un paciente por ID
     */
    public function test_can_retrieve_patient()
    {
        $patient = Patient::factory()->create([
            'first_name' => 'Maria',
            'last_name' => 'García',
        ]);

        $retrieved = Patient::find($patient->id);

        $this->assertEquals('Maria', $retrieved->first_name);
        $this->assertEquals('García', $retrieved->last_name);
    }

    /**
     * Test: Eliminar un paciente
     */
    public function test_can_delete_patient()
    {
        $patient = Patient::factory()->create();
        $patientId = $patient->id;

        $patient->delete();

        $this->assertDatabaseMissing('patients', [
            'id' => $patientId,
        ]);
    }

    /**
     * Test: Marcar un paciente como inactivo
     */
    public function test_can_mark_patient_as_inactive()
    {
        $patient = Patient::factory()->create(['status' => 'active']);

        $patient->update(['status' => 'inactive']);

        $this->assertDatabaseHas('patients', [
            'id' => $patient->id,
            'status' => 'inactive',
        ]);
    }

    /**
     * Test: Paciente pertenece a un tipo de seguro
     */
    public function test_patient_belongs_to_insurance_type()
    {
        $insurance = InsuranceType::factory()->create([
            'name' => 'Seguros Generales',
        ]);

        $patient = Patient::factory()->withInsurance($insurance)->create();

        $this->assertEquals($insurance->id, $patient->insurance_type_id);
        $this->assertInstanceOf(InsuranceType::class, $patient->insuranceType);
        $this->assertEquals('Seguros Generales', $patient->insuranceType->name);
    }

    /**
     * Test: Paciente sin seguro
     */
    public function test_patient_without_insurance()
    {
        $patient = Patient::factory()->withoutInsurance()->create();

        $this->assertNull($patient->insurance_type_id);
        $this->assertNull($patient->insurance_number);
    }

    /**
     * Test: Obtener nombre completo del paciente
     */
    public function test_can_get_patient_full_name()
    {
        $patient = Patient::factory()->create([
            'first_name' => 'Carlos',
            'last_name' => 'López',
        ]);

        $fullName = $patient->full_name;

        $this->assertEquals('Carlos López', $fullName);
    }

    /**
     * Test: Obtener documento formateado
     */
    public function test_can_get_formatted_document()
    {
        $patient = Patient::factory()->create([
            'document_type' => 'CI',
            'document_number' => '4567890',
        ]);

        // Suponiendo que formatted_document es "CI 4567890"
        $formatted = $patient->formatted_document;

        $this->assertStringContainsString('4567890', $formatted);
    }

    /**
     * Test: Obtener edad del paciente
     */
    public function test_can_get_patient_age()
    {
        $patient = Patient::factory()->create([
            'birth_date' => now()->subYears(35),
        ]);

        $age = $patient->age;

        $this->assertEquals(35, $age);
    }

    /**
     * Test: Información del seguro
     */
    public function test_can_get_insurance_info()
    {
        $insurance = InsuranceType::factory()->create(['name' => 'Salud Total']);
        
        $patient = Patient::factory()
            ->withInsurance($insurance)
            ->create([
                'insurance_number' => 'ST-123456',
                'insurance_coverage_percentage' => 85.00,
            ]);

        $insuranceInfo = $patient->insurance_info;

        $this->assertNotEmpty($insuranceInfo);
        $this->assertStringContainsString('ST-123456', $insuranceInfo);
    }

    /**
     * Test: Seguro del paciente está vencido
     */
    public function test_patient_with_expired_insurance()
    {
        $patient = Patient::factory()->withExpiredInsurance()->create();

        $this->assertNotNull($patient->insurance_valid_until);
        $this->assertTrue($patient->insurance_valid_until->isPast());
    }

    /**
     * Test: Seguro del paciente es válido
     */
    public function test_patient_with_valid_insurance()
    {
        $patient = Patient::factory()->create([
            'insurance_valid_until' => now()->addMonths(6),
        ]);

        $this->assertNotNull($patient->insurance_valid_until);
        $this->assertTrue($patient->insurance_valid_until->isFuture());
    }

    /**
     * Test: Obtener pacientes activos
     */
    public function test_can_get_active_patients()
    {
        Patient::factory(5)->create(['status' => 'active']);
        Patient::factory(3)->create(['status' => 'inactive']);

        $activeCount = Patient::where('status', 'active')->count();

        $this->assertEquals(5, $activeCount);
    }

    /**
     * Test: Buscar pacientes por documento
     */
    public function test_can_search_patient_by_document()
    {
        $patient = Patient::factory()->create([
            'document_number' => '9876543',
        ]);

        $found = Patient::where('document_number', '9876543')->first();

        $this->assertNotNull($found);
        $this->assertEquals($patient->id, $found->id);
    }

    /**
     * Test: Buscar pacientes por nombre
     */
    public function test_can_search_patient_by_name()
    {
        Patient::factory()->create([
            'first_name' => 'Roberto',
            'last_name' => 'Martínez',
        ]);

        $found = Patient::where('first_name', 'Roberto')->first();

        $this->assertNotNull($found);
        $this->assertEquals('Roberto', $found->first_name);
    }

    /**
     * Test: Paciente puede tener contacto de emergencia
     */
    public function test_patient_can_have_emergency_contact()
    {
        $patient = Patient::factory()->create([
            'emergency_contact_name' => 'Ana López',
            'emergency_contact_phone' => '0975555555',
        ]);

        $this->assertEquals('Ana López', $patient->emergency_contact_name);
        $this->assertEquals('0975555555', $patient->emergency_contact_phone);
    }

    /**
     * Test: Campos opcionales de paciente (sin contacto de emergencia)
     */
    public function test_patient_without_emergency_contact()
    {
        $patient = Patient::factory()->create([
            'emergency_contact_name' => null,
            'emergency_contact_phone' => null,
        ]);

        $this->assertNull($patient->emergency_contact_name);
        $this->assertNull($patient->emergency_contact_phone);
    }

    /**
     * Test: Paciente de género masculino
     */
    public function test_patient_male()
    {
        $patient = Patient::factory()->male()->create();

        $this->assertEquals('M', $patient->gender);
    }

    /**
     * Test: Paciente de género femenino
     */
    public function test_patient_female()
    {
        $patient = Patient::factory()->female()->create();

        $this->assertEquals('F', $patient->gender);
    }

    /**
     * Test: Múltiples pacientes con misma ciudad
     */
    public function test_multiple_patients_same_city()
    {
        Patient::factory(4)->create(['city' => 'Encarnación']);
        Patient::factory(3)->create(['city' => 'Ciudad del Este']);

        $encarnacionCount = Patient::where('city', 'Encarnación')->count();

        $this->assertEquals(4, $encarnacionCount);
    }
}
