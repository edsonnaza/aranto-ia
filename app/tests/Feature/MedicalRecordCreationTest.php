<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Patient;
use App\Models\MedicalRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MedicalRecordCreationTest extends TestCase
{
    use RefreshDatabase;

    public function test_medical_record_creation_persists_snapshot_and_vitals_row()
    {
        $user = User::factory()->create();

        // Ensure doctor role exists and assign to user
        Role::firstOrCreate(['name' => 'doctor']);
        $user->assignRole('doctor');

        $patient = Patient::factory()->create();

        $payload = [
            'consultation_date' => now()->toDateTimeString(),
            'reason' => 'Consulta de prueba',
            'vital_signs' => [
                'temperature' => 37.2,
                'pulse' => 72,
                'spo2' => 98,
                'respiratory_rate' => 18,
                'bp_systolic' => 120,
                'bp_diastolic' => 80,
                'blood_pressure' => '120/80',
            ],
        ];

        // Disable middleware (CSRF/session) for this POST in test environment
        $this->withoutMiddleware();
        $response = $this->actingAs($user)->post(route('medical.patients.medical-records.store', ['patient' => $patient->id]), $payload);

        $response->assertRedirect(route('medical.patients.show', $patient->id));

        $mr = MedicalRecord::where('patient_id', $patient->id)->latest()->first();
        $this->assertNotNull($mr, 'Expected a medical record to be created');

        $this->assertArrayHasKey('temperature', $mr->vital_signs ?? [], 'Snapshot should include temperature');
        $this->assertEquals(37.2, $mr->vital_signs['temperature']);

        $this->assertDatabaseHas('vital_signs', [
            'patient_id' => $patient->id,
            'temperature' => 37.2,
            'pulse' => 72,
        ]);
    }
}
