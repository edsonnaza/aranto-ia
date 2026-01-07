<?php

namespace Tests\Feature\CashRegister;

use App\Models\Patient;
use App\Models\ServiceRequest;
use App\Models\User;
use Database\Seeders\CashRegisterPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;
use App\Models\CashRegisterSession;
use App\Models\Transaction;

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
        $service = \App\Models\MedicalService::create(['name' => 'X-Ray', 'code' => 'XRAY', 'status' => 'active']);
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

    public function test_process_service_payment_redirects_and_commits()
    {
        $this->seed(CashRegisterPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->givePermissionTo('cash_register.process_payments');

        // Create active session for user
        $session = CashRegisterSession::create([
            'user_id' => $user->id,
            'opening_date' => now(),
            'initial_amount' => 0,
            'calculated_balance' => 0,
            'total_income' => 0,
            'total_expenses' => 0,
            'status' => 'open',
        ]);

        $patient = Patient::create([
            'document_type' => 'DNI',
            'document_number' => '00000',
            'first_name' => 'Pago',
            'last_name' => 'Test',
            'birth_date' => now()->subYears(20),
            'status' => 'active'
        ]);

        $sr = ServiceRequest::create([
            'patient_id' => $patient->id,
            'request_number' => 'TXN-001',
            'request_date' => now()->toDateString(),
            'status' => ServiceRequest::STATUS_PENDING_PAYMENT,
            'reception_type' => ServiceRequest::RECEPTION_WALK_IN,
            'priority' => ServiceRequest::PRIORITY_NORMAL,
            'total_amount' => 150,
            'paid_amount' => 0,
            'payment_status' => ServiceRequest::PAYMENT_PENDING,
        ]);

        $response = $this->actingAs($user)->post(route('cash-register.process-service-payment'), [
            'service_request_id' => $sr->id,
            'payment_method' => 'CASH',
            'amount' => 150,
            'notes' => 'Pago test'
        ]);

        $response->assertRedirect(route('cash-register.pending-services'));

        $sr->refresh();
        $this->assertEquals(ServiceRequest::PAYMENT_PAID, $sr->payment_status);

        $this->assertDatabaseHas('transactions', [
            'service_request_id' => $sr->id,
            'amount' => 150,
            'type' => 'INCOME'
        ]);
    }
}
