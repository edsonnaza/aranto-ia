<?php

namespace Tests\Feature;

use App\Models\Professional;
use App\Models\Specialty;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfessionalTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test: Crear un profesional
     */
    public function test_can_create_professional()
    {
        $professional = Professional::create([
            'document_type' => 'CI',
            'document_number' => '1234567',
            'first_name' => 'José',
            'last_name' => 'González',
            'birth_date' => now()->subYears(45),
            'phone' => '0961234567',
            'email' => 'jose@example.com',
            'professional_license' => 'LIC-001',
            'title' => 'Dr.',
            'commission_percentage' => 20.00,
            'commission_calculation_method' => 'percentage',
            'status' => 'active',
            'hire_date' => now()->subYears(5),
        ]);

        $this->assertDatabaseHas('professionals', [
            'id' => $professional->id,
            'document_number' => '1234567',
            'first_name' => 'José',
        ]);
    }

    /**
     * Test: Actualizar un profesional
     */
    public function test_can_update_professional()
    {
        $professional = Professional::factory()->create([
            'email' => 'old@example.com',
            'commission_percentage' => 15.00,
        ]);

        $professional->update([
            'email' => 'new@example.com',
            'commission_percentage' => 25.00,
        ]);

        $this->assertDatabaseHas('professionals', [
            'id' => $professional->id,
            'email' => 'new@example.com',
            'commission_percentage' => 25.00,
        ]);
    }

    /**
     * Test: Obtener un profesional por ID
     */
    public function test_can_retrieve_professional()
    {
        $professional = Professional::factory()->create([
            'first_name' => 'Roberto',
            'last_name' => 'Martínez',
        ]);

        $retrieved = Professional::find($professional->id);

        $this->assertEquals('Roberto', $retrieved->first_name);
        $this->assertEquals('Martínez', $retrieved->last_name);
    }

    /**
     * Test: Marcar un profesional como inactivo
     */
    public function test_can_mark_professional_as_inactive()
    {
        $professional = Professional::factory()->create(['status' => 'active']);

        $professional->update(['status' => 'inactive']);

        $this->assertDatabaseHas('professionals', [
            'id' => $professional->id,
            'status' => 'inactive',
        ]);
    }

    /**
     * Test: Profesional con licencia vencida
     */
    public function test_professional_with_expired_license()
    {
        $professional = Professional::factory()->withExpiredLicense()->create();

        $this->assertNotNull($professional->license_expiry_date);
        $this->assertTrue($professional->license_expiry_date->isPast());
    }

    /**
     * Test: Profesional con licencia válida
     */
    public function test_professional_with_valid_license()
    {
        $professional = Professional::factory()->withValidLicense()->create();

        $this->assertNotNull($professional->license_expiry_date);
        $this->assertTrue($professional->license_expiry_date->isFuture());
    }

    /**
     * Test: Obtener nombre completo del profesional
     */
    public function test_can_get_professional_full_name()
    {
        $professional = Professional::factory()->create([
            'title' => 'Dra.',
            'first_name' => 'Andrea',
            'last_name' => 'López',
        ]);

        $fullName = $professional->full_name;

        $this->assertEquals('Dra. Andrea López', $fullName);
    }

    /**
     * Test: Obtener documento formateado
     */
    public function test_can_get_formatted_document()
    {
        $professional = Professional::factory()->create([
            'document_type' => 'CI',
            'document_number' => '8765432',
        ]);

        $formatted = $professional->formatted_document;

        $this->assertStringContainsString('8765432', $formatted);
    }

    /**
     * Test: Profesional puede tener múltiples especialidades
     */
    public function test_professional_can_have_specialties()
    {
        $specialty1 = Specialty::factory()->create(['name' => 'Cardiología']);
        $specialty2 = Specialty::factory()->create(['name' => 'Medicina Interna']);

        $professional = Professional::factory()->create();
        
        $professional->specialties()->attach([
            $specialty1->id => ['certification_date' => now()],
            $specialty2->id => ['certification_date' => now()],
        ]);

        $this->assertEquals(2, $professional->specialties->count());
        $this->assertTrue($professional->specialties->contains($specialty1));
        $this->assertTrue($professional->specialties->contains($specialty2));
    }

    /**
     * Test: Profesional con comisión por porcentaje
     */
    public function test_professional_with_percentage_commission()
    {
        $professional = Professional::factory()
            ->withPercentageCommission(25.00)
            ->create();

        $this->assertEquals(25.00, $professional->commission_percentage);
        $this->assertEquals('percentage', $professional->commission_calculation_method);
    }

    /**
     * Test: Profesional con comisión fija
     */
    public function test_professional_with_fixed_commission()
    {
        $professional = Professional::factory()
            ->withFixedCommission(50.00)
            ->create();

        $this->assertEquals(50.00, $professional->commission_percentage);
        $this->assertEquals('fixed_amount', $professional->commission_calculation_method);
    }

    /**
     * Test: Profesional terminado
     */
    public function test_terminated_professional()
    {
        $professional = Professional::factory()->terminated()->create();

        $this->assertEquals('inactive', $professional->status);
        $this->assertNotNull($professional->termination_date);
        $this->assertTrue($professional->termination_date->isPast());
    }

    /**
     * Test: Años de servicio del profesional
     */
    public function test_professional_years_of_service()
    {
        $professional = Professional::factory()->create([
            'hire_date' => now()->subYears(8),
        ]);

        $yearsOfService = $professional->years_of_service;

        $this->assertEquals(8, intval($yearsOfService));
    }

    /**
     * Test: Obtener profesionales activos
     */
    public function test_can_get_active_professionals()
    {
        Professional::factory(4)->create(['status' => 'active']);
        Professional::factory(2)->create(['status' => 'inactive']);

        $activeCount = Professional::where('status', 'active')->count();

        $this->assertEquals(4, $activeCount);
    }

    /**
     * Test: Buscar profesional por documento
     */
    public function test_can_search_professional_by_document()
    {
        $professional = Professional::factory()->create([
            'document_number' => '5555555',
        ]);

        $found = Professional::where('document_number', '5555555')->first();

        $this->assertNotNull($found);
        $this->assertEquals($professional->id, $found->id);
    }

    /**
     * Test: Buscar profesional por email
     */
    public function test_can_search_professional_by_email()
    {
        $professional = Professional::factory()->create([
            'email' => 'doctor@example.com',
        ]);

        $found = Professional::where('email', 'doctor@example.com')->first();

        $this->assertNotNull($found);
        $this->assertEquals($professional->id, $found->id);
    }

    /**
     * Test: Múltiples profesionales con misma especialidad
     */
    public function test_multiple_professionals_same_specialty()
    {
        $specialty = Specialty::factory()->create(['name' => 'Pediatría']);

        $prof1 = Professional::factory()->create();
        $prof2 = Professional::factory()->create();
        $prof3 = Professional::factory()->create();

        $prof1->specialties()->attach($specialty->id);
        $prof2->specialties()->attach($specialty->id);
        $prof3->specialties()->attach($specialty->id);

        $pediatricians = $specialty->professionals()->count();

        $this->assertEquals(3, $pediatricians);
    }

    /**
     * Test: Profesional con título profesional
     */
    public function test_professional_with_title()
    {
        $professional = Professional::factory()->create([
            'title' => 'Dr.',
            'first_name' => 'Fernando',
            'last_name' => 'Ruiz',
        ]);

        $this->assertEquals('Dr.', $professional->title);
    }
}
