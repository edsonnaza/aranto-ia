<?php

namespace Database\Factories;

use App\Models\Transaction;
use App\Models\CashRegisterSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionFactory extends Factory
{
    protected $model = Transaction::class;

    public function definition(): array
    {
        $type = $this->faker->randomElement(['INCOME', 'EXPENSE']);

        return [
            'cash_register_session_id' => CashRegisterSession::factory(),
            'type' => $type,
            'category' => $this->faker->randomElement(['SERVICE_PAYMENT', 'SUPPLIER_PAYMENT', 'COMMISSION_LIQUIDATION', 'CASH_DIFFERENCE', 'OTHER']),
            'amount' => $this->faker->numberBetween(5000, 100000),
            'concept' => $this->faker->sentence(3),
            'patient_id' => null,
            'professional_id' => null,
            'liquidation_id' => null,
            'user_id' => User::factory(),
            'status' => 'active',
            'original_transaction_id' => null,
            'cancellation_reason' => null,
            'cancelled_by' => null,
            'cancelled_at' => null,
        ];
    }

    public function income(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'type' => 'INCOME',
                'category' => $this->faker->randomElement(['SERVICE_PAYMENT', 'COMMISSION_LIQUIDATION']),
            ];
        });
    }

    public function expense(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'type' => 'EXPENSE',
                'category' => $this->faker->randomElement(['SUPPLIER_PAYMENT', 'OTHER']),
            ];
        });
    }

    public function refund(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'type' => 'EXPENSE',
                'category' => 'OTHER',
            ];
        });
    }

    public function pending(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'pending',
            ];
        });
    }

    public function cancelled(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'cancelled',
                'cancellation_reason' => 'Cancelled by user',
                'cancelled_by' => User::factory(),
                'cancelled_at' => now(),
            ];
        });
    }
}
