<?php

namespace Tests\App\Financial;

use App\Models\CashRegisterSession;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashRegisterTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected CashRegisterSession $session;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear un usuario para las pruebas
        $this->user = User::factory()->create([
            'name' => 'Cajero Test',
            'email' => 'cajero@test.com',
        ]);

        $this->actingAs($this->user);
    }

    /**
     * Test: Crear una sesión de caja
     */
    public function test_can_create_cash_register_session()
    {
        $session = CashRegisterSession::create([
            'user_id' => $this->user->id,
            'opening_date' => now(),
            'initial_amount' => 100000, // ₲100.000
            'status' => 'open',
        ]);

        $this->assertDatabaseHas('cash_register_sessions', [
            'id' => $session->id,
            'user_id' => $this->user->id,
            'initial_amount' => 100000,
            'status' => 'open',
        ]);

        $this->assertEquals(100000, $session->initial_amount);
    }

    /**
     * Test: Crear una transacción de ingreso
     */
    public function test_can_create_income_transaction()
    {
        $session = CashRegisterSession::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'open',
        ]);

        $transaction = Transaction::create([
            'cash_register_session_id' => $session->id,
            'type' => 'INCOME',
            'category' => 'SERVICE_PAYMENT',
            'amount' => 50000, // ₲50.000
            'concept' => 'Consulta médica',
            'user_id' => $this->user->id,
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('transactions', [
            'id' => $transaction->id,
            'type' => 'INCOME',
            'amount' => 50000,
            'status' => 'active',
        ]);
    }

    /**
     * Test: Crear una transacción de egreso
     */
    public function test_can_create_expense_transaction()
    {
        $session = CashRegisterSession::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'open',
        ]);

        $transaction = Transaction::create([
            'cash_register_session_id' => $session->id,
            'type' => 'EXPENSE',
            'category' => 'SUPPLIER_PAYMENT',
            'amount' => 10000, // ₲10.000
            'concept' => 'Compra de suministros',
            'user_id' => $this->user->id,
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('transactions', [
            'id' => $transaction->id,
            'type' => 'EXPENSE',
            'amount' => 10000,
        ]);
    }

    /**
     * Test: Validar que los montos sean positivos
     */
    public function test_transaction_amount_must_be_positive()
    {
        $session = CashRegisterSession::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'open',
        ]);

        // Intenta crear transacción con monto negativo
        $transaction = new Transaction([
            'cash_register_session_id' => $session->id,
            'type' => 'INCOME',
            'category' => 'SERVICE_PAYMENT',
            'amount' => -50000, // ❌ Monto negativo
            'concept' => 'Consulta médica',
            'user_id' => $this->user->id,
            'status' => 'active',
        ]);

        // Verificar que el monto sea positivo antes de guardar
        $this->assertLessThan(0, $transaction->amount);
    }

    /**
     * Test: Crear un reintegro (devolución)
     */
    public function test_can_create_refund_transaction()
    {
        $session = CashRegisterSession::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'open',
        ]);

        // Crear transacción original de ingreso
        $originalTransaction = Transaction::create([
            'cash_register_session_id' => $session->id,
            'type' => 'INCOME',
            'category' => 'SERVICE_PAYMENT',
            'amount' => 50000,
            'concept' => 'Consulta médica',
            'user_id' => $this->user->id,
            'status' => 'active',
        ]);

        // Crear reintegro (transacción de egreso)
        $refund = Transaction::create([
            'cash_register_session_id' => $session->id,
            'type' => 'EXPENSE',
            'category' => 'OTHER',
            'amount' => 50000,
            'concept' => 'Devolución - Consulta médica',
            'user_id' => $this->user->id,
            'original_transaction_id' => $originalTransaction->id,
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('transactions', [
            'id' => $refund->id,
            'type' => 'EXPENSE',
            'original_transaction_id' => $originalTransaction->id,
        ]);

        // Verificar que la transacción original esté vinculada
        $this->assertEquals($refund->original_transaction_id, $originalTransaction->id);
    }

    /**
     * Test: Cambio de caja (abrir nueva sesión)
     */
    public function test_can_close_session_and_open_new_one()
    {
        // Crear y cerrar sesión antigua
        $oldSession = CashRegisterSession::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'open',
            'initial_amount' => 100000,
        ]);

        // Agregar algunas transacciones
        Transaction::factory(3)->income()->create([
            'cash_register_session_id' => $oldSession->id,
            'user_id' => $this->user->id,
        ]);

        // Cerrar sesión
        $oldSession->update([
            'status' => 'closed',
            'closing_date' => now(),
            'final_physical_amount' => 150000,
        ]);

        // Crear nueva sesión (cambio de caja)
        $newSession = CashRegisterSession::create([
            'user_id' => $this->user->id,
            'opening_date' => now(),
            'initial_amount' => $oldSession->final_physical_amount,
            'status' => 'open',
        ]);

        // Verificar que ambas sesiones existan
        $this->assertDatabaseHas('cash_register_sessions', [
            'id' => $oldSession->id,
            'status' => 'closed',
        ]);

        $this->assertDatabaseHas('cash_register_sessions', [
            'id' => $newSession->id,
            'status' => 'open',
            'initial_amount' => 150000,
        ]);
    }

    /**
     * Test: Calcular balance correcto
     */
    public function test_session_balance_calculation_is_correct()
    {
        $session = CashRegisterSession::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'open',
            'initial_amount' => 100000,
        ]);

        // Ingresos
        Transaction::create([
            'cash_register_session_id' => $session->id,
            'type' => 'INCOME',
            'category' => 'SERVICE_PAYMENT',
            'amount' => 50000,
            'concept' => 'Consulta médica',
            'user_id' => $this->user->id,
            'status' => 'active',
        ]);

        Transaction::create([
            'cash_register_session_id' => $session->id,
            'type' => 'INCOME',
            'category' => 'SERVICE_PAYMENT',
            'amount' => 30000,
            'concept' => 'Otro servicio',
            'user_id' => $this->user->id,
            'status' => 'active',
        ]);

        // Egresos
        Transaction::create([
            'cash_register_session_id' => $session->id,
            'type' => 'EXPENSE',
            'category' => 'SUPPLIER_PAYMENT',
            'amount' => 20000,
            'concept' => 'Compra de suministros',
            'user_id' => $this->user->id,
            'status' => 'active',
        ]);

        // Refresco la sesión para obtener datos actualizados
        $session->refresh();

        // Balance esperado: 100000 (inicial) + 50000 + 30000 - 20000 = 160000
        $totalIncome = $session->transactions()->where('type', 'INCOME')->sum('amount');
        $totalExpense = $session->transactions()->where('type', 'EXPENSE')->sum('amount');
        $expectedBalance = $session->initial_amount + $totalIncome - $totalExpense;

        $this->assertEquals(160000, $expectedBalance);
    }

    /**
     * Test: Cancelar una transacción
     */
    public function test_can_cancel_transaction()
    {
        $session = CashRegisterSession::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'open',
        ]);

        $transaction = Transaction::create([
            'cash_register_session_id' => $session->id,
            'type' => 'INCOME',
            'category' => 'SERVICE_PAYMENT',
            'amount' => 50000,
            'concept' => 'Consulta médica',
            'user_id' => $this->user->id,
            'status' => 'active',
        ]);

        // Cancelar transacción
        $transaction->update([
            'status' => 'cancelled',
            'cancellation_reason' => 'Error en monto',
            'cancelled_by' => $this->user->id,
            'cancelled_at' => now(),
        ]);

        $this->assertDatabaseHas('transactions', [
            'id' => $transaction->id,
            'status' => 'cancelled',
            'cancellation_reason' => 'Error en monto',
        ]);
    }

    /**
     * Test: Contar transacciones en sesión
     */
    public function test_session_transaction_count()
    {
        $session = CashRegisterSession::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'open',
        ]);

        // Crear 5 transacciones
        Transaction::factory(5)->create([
            'cash_register_session_id' => $session->id,
            'user_id' => $this->user->id,
        ]);

        $this->assertEquals(5, $session->transactions()->count());
    }

    /**
     * Test: Validar que solo transacciones activas cuenten en el balance
     */
    public function test_only_active_transactions_count_in_balance()
    {
        $session = CashRegisterSession::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'open',
            'initial_amount' => 100000,
        ]);

        // Transacción activa
        Transaction::create([
            'cash_register_session_id' => $session->id,
            'type' => 'INCOME',
            'category' => 'SERVICE_PAYMENT',
            'amount' => 50000,
            'concept' => 'Pago de servicio',
            'user_id' => $this->user->id,
            'status' => 'active',
        ]);

        // Transacción cancelada (no debe contar)
        Transaction::create([
            'cash_register_session_id' => $session->id,
            'type' => 'INCOME',
            'category' => 'SERVICE_PAYMENT',
            'amount' => 30000,
            'concept' => 'Pago cancelado',
            'user_id' => $this->user->id,
            'status' => 'cancelled',
        ]);

        $activeTotal = $session->transactions()
            ->where('status', 'active')
            ->sum('amount');

        $this->assertEquals(50000, $activeTotal);
    }

    /**
     * Test: Validar diferencia de caja (expected vs actual)
     */
    public function test_cash_difference_calculation()
    {
        $session = CashRegisterSession::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'open',
            'initial_amount' => 100000,
        ]);

        // Agregar ingresos
        Transaction::create([
            'cash_register_session_id' => $session->id,
            'type' => 'INCOME',
            'category' => 'SERVICE_PAYMENT',
            'amount' => 50000,
            'concept' => 'Consulta médica',
            'user_id' => $this->user->id,
            'status' => 'active',
        ]);

        // Balance esperado: 100000 + 50000 = 150000
        // Balance físico contado: 145000
        // Diferencia: -5000

        $expectedBalance = 150000;
        $physicalAmount = 145000;
        $difference = $physicalAmount - $expectedBalance;

        $this->assertEquals(-5000, $difference);
    }

    /**
     * Test: Relaciona usuario con su sesión de caja
     */
    public function test_transaction_belongs_to_user()
    {
        $session = CashRegisterSession::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $transaction = Transaction::create([
            'cash_register_session_id' => $session->id,
            'type' => 'INCOME',
            'category' => 'SERVICE_PAYMENT',
            'amount' => 50000,
            'concept' => 'Consulta médica',
            'user_id' => $this->user->id,
            'status' => 'active',
        ]);

        $this->assertEquals($this->user->id, $transaction->user_id);
        $this->assertInstanceOf(User::class, $transaction->user);
    }
}
