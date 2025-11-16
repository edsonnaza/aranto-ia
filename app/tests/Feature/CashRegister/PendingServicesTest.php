<?php

namespace Tests\Feature\CashRegister;

use App\Models\Patient;
use App\Models\ServiceRequest;
use App\Models\User;
use Database\Seeders\CashRegisterPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PendingServicesTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_filter_by_partial_payment_status()
    {
        // Ensure permissions exist
        $this->seed(CashRegisterPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->givePermissionTo('cash_register.view');

        $patient = Patient::create([
            'document_type' => 'DNI',
            'document_number' => '12345678',
            'first_name' => 'Test',
            'last_name' => 'Patient',
            'birth_date' => now()->subYears(30),
            'status' => 'active'
        ]);

        // Create a partial and a pending request
        ServiceRequest::create([
            'patient_id' => $patient->id,
            'request_number' => 'TST-001',
            'request_date' => now()->toDateString(),
            'status' => ServiceRequest::STATUS_PENDING_PAYMENT,
            'reception_type' => ServiceRequest::RECEPTION_WALK_IN,
            'priority' => ServiceRequest::PRIORITY_NORMAL,
            'total_amount' => 100,
            'paid_amount' => 50,
            'payment_status' => ServiceRequest::PAYMENT_PARTIAL,
        ]);

        ServiceRequest::create([
            'patient_id' => $patient->id,
            'request_number' => 'TST-002',
            'request_date' => now()->toDateString(),
            'status' => ServiceRequest::STATUS_PENDING_PAYMENT,
            'reception_type' => ServiceRequest::RECEPTION_WALK_IN,
            'priority' => ServiceRequest::PRIORITY_NORMAL,
            'total_amount' => 200,
            'paid_amount' => 0,
            'payment_status' => ServiceRequest::PAYMENT_PENDING,
        ]);

        $response = $this->actingAs($user)->get(route('cash-register.pending-services', [
            'payment_status' => ServiceRequest::PAYMENT_PARTIAL
        ]));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('CashRegister/PendingServices')
                ->where('filters.payment_status', ServiceRequest::PAYMENT_PARTIAL)
                ->has('serviceRequests.data', 1)
                ->where('serviceRequests.data.0.payment_status', ServiceRequest::PAYMENT_PARTIAL)
            );
    }

    public function test_can_filter_by_insurance_type()
    {
        $this->seed(CashRegisterPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->givePermissionTo('cash_register.view');

        $patient = Patient::create([
            'document_type' => 'DNI',
            'document_number' => '51234567',
            'first_name' => 'Insured',
            'last_name' => 'Patient',
            'birth_date' => now()->subYears(30),
            'status' => 'active'
        ]);

        $insuranceA = \App\Models\InsuranceType::create(['name' => 'Alpha', 'code' => 'AL', 'status' => 'active']);
        $insuranceB = \App\Models\InsuranceType::create(['name' => 'Beta', 'code' => 'BE', 'status' => 'active']);

        // Create supporting data for details
        $service = \App\Models\Service::create(['name' => 'X-Ray', 'status' => 'active']);
        $professional = \App\Models\Professional::create(['first_name' => 'Doc', 'last_name' => 'One', 'status' => 'active']);

        // Request A with insurance Alpha
        $reqA = ServiceRequest::create([
            'patient_id' => $patient->id,
            'request_number' => 'INS-001',
            'request_date' => now()->toDateString(),
            'status' => ServiceRequest::STATUS_PENDING_PAYMENT,
            'reception_type' => ServiceRequest::RECEPTION_WALK_IN,
            'priority' => ServiceRequest::PRIORITY_NORMAL,
            'total_amount' => 100,
            'paid_amount' => 0,
            'payment_status' => ServiceRequest::PAYMENT_PENDING,
        ]);

        \App\Models\ServiceRequestDetail::create([
            'service_request_id' => $reqA->id,
            'medical_service_id' => $service->id,
            'professional_id' => $professional->id,
            'insurance_type_id' => $insuranceA->id,
            'unit_price' => 100,
            'quantity' => 1,
            'status' => \App\Models\ServiceRequestDetail::STATUS_PENDING,
        ]);

        // Request B with insurance Beta
        $reqB = ServiceRequest::create([
            'patient_id' => $patient->id,
            'request_number' => 'INS-002',
            'request_date' => now()->toDateString(),
            'status' => ServiceRequest::STATUS_PENDING_PAYMENT,
            'reception_type' => ServiceRequest::RECEPTION_WALK_IN,
            'priority' => ServiceRequest::PRIORITY_NORMAL,
            'total_amount' => 200,
            'paid_amount' => 0,
            'payment_status' => ServiceRequest::PAYMENT_PENDING,
        ]);

        \App\Models\ServiceRequestDetail::create([
            'service_request_id' => $reqB->id,
            'medical_service_id' => $service->id,
            'professional_id' => $professional->id,
            'insurance_type_id' => $insuranceB->id,
            'unit_price' => 200,
            'quantity' => 1,
            'status' => \App\Models\ServiceRequestDetail::STATUS_PENDING,
        ]);

        $response = $this->actingAs($user)->get(route('cash-register.pending-services', [
            'insurance_type' => $insuranceA->id
        ]));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('CashRegister/PendingServices')
                ->has('serviceRequests.data', 1)
                ->where('serviceRequests.data.0.services.0.insurance_type', $insuranceA->name)
            );
    }

    public function test_default_shows_only_pending_when_no_filter()
    {
        $this->seed(CashRegisterPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->givePermissionTo('cash_register.view');

        $patient = Patient::create([
            'document_type' => 'DNI',
            'document_number' => '87654321',
            'first_name' => 'Default',
            'last_name' => 'Patient',
            'birth_date' => now()->subYears(25),
            'status' => 'active'
        ]);

        ServiceRequest::create([
            'patient_id' => $patient->id,
            'request_number' => 'TST-003',
            'request_date' => now()->toDateString(),
            'status' => ServiceRequest::STATUS_PENDING_PAYMENT,
            'reception_type' => ServiceRequest::RECEPTION_WALK_IN,
            'priority' => ServiceRequest::PRIORITY_NORMAL,
            'total_amount' => 10,
            'paid_amount' => 0,
            'payment_status' => ServiceRequest::PAYMENT_PENDING,
        ]);

        ServiceRequest::create([
            'patient_id' => $patient->id,
            'request_number' => 'TST-004',
            'request_date' => now()->toDateString(),
            'status' => ServiceRequest::STATUS_PENDING_PAYMENT,
            'reception_type' => ServiceRequest::RECEPTION_WALK_IN,
            'priority' => ServiceRequest::PRIORITY_NORMAL,
            'total_amount' => 10,
            'paid_amount' => 10,
            'payment_status' => ServiceRequest::PAYMENT_PAID,
        ]);

        $response = $this->actingAs($user)->get(route('cash-register.pending-services'));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('CashRegister/PendingServices')
                ->has('serviceRequests.data', 1)
                ->where('serviceRequests.data.0.payment_status', ServiceRequest::PAYMENT_PENDING)
            );
    }
}
