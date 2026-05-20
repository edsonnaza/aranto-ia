<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Patient;
use App\Models\VitalSign;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VitalSignsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_vital_signs_api_returns_paginated_metric_data()
    {
        $user = User::factory()->create();
        $patient = Patient::factory()->create();

        // Create 30 vital sign records for the patient
        for ($i = 0; $i < 30; $i++) {
            VitalSign::create([
                'patient_id' => $patient->id,
                'temperature' => 36 + ($i % 5) / 10,
                'pulse' => 60 + $i,
                'spo2' => 95,
                'respiratory_rate' => 16,
                'bp_systolic' => 120,
                'bp_diastolic' => 80,
                'blood_pressure' => '120/80',
                'recorded_at' => now()->subDays(30 - $i),
            ]);
        }

        $response = $this->actingAs($user)->getJson(route('medical.patients.vitals.data', [
            'patient' => $patient->id,
            'metric' => 'temperature',
            'per_page' => 10,
            'order' => 'asc',
        ]));

        $response->assertStatus(200);
        $json = $response->json();

        $this->assertArrayHasKey('data', $json);
        $this->assertCount(10, $json['data']);

        // Verify the recorded_at values are in ascending order
        $first = $json['data'][0]['recorded_at'];
        $last = $json['data'][count($json['data']) - 1]['recorded_at'];
        $this->assertTrue($first <= $last, 'Expected first recorded_at to be <= last recorded_at');
    }
}
