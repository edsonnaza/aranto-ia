<?php

use App\Models\Patient;
use App\Models\InsuranceType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Patient Model Operations', function () {
    
    test('can create patient via factory', function () {
        $patient = Patient::factory()->create([
            'first_name' => 'Juan',
            'last_name' => 'Pérez',
        ]);
        
        $this->assertDatabaseHas('patients', [
            'first_name' => 'Juan',
            'last_name' => 'Pérez',
        ]);
    });

    test('can create patient with insurance', function () {
        $insurance = InsuranceType::factory()->active()->create();
        $patient = Patient::factory()->create([
            'insurance_type_id' => $insurance->id,
        ]);
        
        $this->assertDatabaseHas('patients', [
            'id' => $patient->id,
            'insurance_type_id' => $insurance->id,
        ]);
    });

    test('can create multiple patients', function () {
        Patient::factory(5)->create();
        
        $this->assertCount(5, Patient::all());
    });

    test('can update patient directly', function () {
        $patient = Patient::factory()->create(['first_name' => 'Original']);
        
        $patient->update(['first_name' => 'Updated']);
        $patient->refresh();
        
        $this->assertEquals('Updated', $patient->first_name);
    });

    test('can delete patient directly', function () {
        $patient = Patient::factory()->create();
        $patientId = $patient->id;
        
        $patient->delete();
        
        $this->assertNull(Patient::find($patientId));
    });

    test('patient age calculated correctly', function () {
        $birthDate = now()->subYears(30)->format('Y-m-d');
        $patient = Patient::factory()->create(['birth_date' => $birthDate]);
        
        $this->assertEquals(30, $patient->age);
    });

    test('patient full name correct', function () {
        $patient = Patient::factory()->create([
            'first_name' => 'Juan',
            'last_name' => 'Pérez',
        ]);
        
        $this->assertEquals('Juan Pérez', $patient->full_name);
    });

    test('patient formatted document correct', function () {
        $patient = Patient::factory()->create([
            'document_type' => 'CI',
            'document_number' => '12345678',
        ]);
        
        $formatted = $patient->formatted_document;
        $this->assertStringContainsString('12345678', $formatted);
    });

    test('can filter active patients', function () {
        Patient::factory(3)->active()->create();
        Patient::factory(2)->inactive()->create();
        
        $active = Patient::where('status', 'active')->count();
        $this->assertEquals(3, $active);
    });

    test('can filter inactive patients', function () {
        Patient::factory(2)->active()->create();
        Patient::factory(3)->inactive()->create();
        
        $inactive = Patient::where('status', 'inactive')->count();
        $this->assertEquals(3, $inactive);
    });

    test('patient insurance coverage valid', function () {
        $insurance = InsuranceType::factory()->active()->create();
        $patient = Patient::factory()->create(['insurance_type_id' => $insurance->id]);
        
        $this->assertNotNull($patient->insurance_coverage_percentage);
        $this->assertGreaterThanOrEqual(0, $patient->insurance_coverage_percentage);
        $this->assertLessThanOrEqual(100, $patient->insurance_coverage_percentage);
    });

    test('patient without insurance has zero coverage', function () {
        $patient = Patient::factory()->withoutInsurance()->create();
        
        $this->assertEquals(0.00, $patient->insurance_coverage_percentage);
    });

    test('patient gender normalization M to F', function () {
        $patient = Patient::factory()->create(['gender' => 'M']);
        $this->assertEquals('M', $patient->gender);
        
        $patient->update(['gender' => 'F']);
        $this->assertEquals('F', $patient->gender);
    });

    test('can add emergency contact', function () {
        $patient = Patient::factory()->create([
            'emergency_contact_name' => 'Contact Name',
            'emergency_contact_phone' => '+58-123-4567',
        ]);
        
        $this->assertEquals('Contact Name', $patient->emergency_contact_name);
        $this->assertEquals('+58-123-4567', $patient->emergency_contact_phone);
    });

    test('can search patient by document', function () {
        Patient::factory()->create(['document_number' => 'DOC-001']);
        Patient::factory()->create(['document_number' => 'DOC-002']);
        
        $patient = Patient::where('document_number', 'DOC-001')->first();
        
        $this->assertNotNull($patient);
        $this->assertEquals('DOC-001', $patient->document_number);
    });

    test('can search patient by name', function () {
        Patient::factory()->create(['first_name' => 'Juan']);
        Patient::factory()->create(['first_name' => 'María']);
        
        $patients = Patient::where('first_name', 'Juan')->get();
        
        $this->assertCount(1, $patients);
    });

    test('document type validation valid', function () {
        $patient = Patient::factory()->create(['document_type' => 'CI']);
        
        $this->assertTrue(in_array($patient->document_type, ['CI', 'PASSPORT', 'OTHER']));
    });

    test('patient can have notes', function () {
        $patient = Patient::factory()->create([
            'notes' => 'Important medical notes',
        ]);
        
        $this->assertEquals('Important medical notes', $patient->notes);
    });

    test('patient status can be changed', function () {
        $patient = Patient::factory()->active()->create();
        $this->assertEquals('active', $patient->status);
        
        $patient->update(['status' => 'inactive']);
        $this->assertEquals('inactive', $patient->status);
    });

    test('multiple patients same city', function () {
        Patient::factory()->create(['city' => 'Caracas']);
        Patient::factory()->create(['city' => 'Caracas']);
        Patient::factory()->create(['city' => 'Valencia']);
        
        $caracas = Patient::where('city', 'Caracas')->count();
        $this->assertEquals(2, $caracas);
    });

    test('patient with address information', function () {
        $patient = Patient::factory()->create([
            'address' => 'Calle 5 #123',
            'city' => 'Caracas',
            'state' => 'Distrito Capital',
            'postal_code' => '1010',
        ]);
        
        $this->assertEquals('Calle 5 #123', $patient->address);
        $this->assertEquals('Caracas', $patient->city);
    });

    test('patient phone and email fields', function () {
        $patient = Patient::factory()->create([
            'phone' => '+58-412-1234567',
            'email' => 'juan@example.com',
        ]);
        
        $this->assertEquals('+58-412-1234567', $patient->phone);
        $this->assertEquals('juan@example.com', $patient->email);
    });

    test('patient birth date stored correctly', function () {
        $birthDate = '1990-05-15';
        $patient = Patient::factory()->create(['birth_date' => $birthDate]);
        
        $this->assertEquals($birthDate, $patient->birth_date->format('Y-m-d'));
    });
});
