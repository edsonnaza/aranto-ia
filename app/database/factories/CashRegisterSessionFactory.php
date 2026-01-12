<?php

namespace Database\Factories;

use App\Models\CashRegisterSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CashRegisterSessionFactory extends Factory
{
    protected $model = CashRegisterSession::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'opening_date' => now(),
            'closing_date' => null,
            'initial_amount' => $this->faker->numberBetween(50000, 200000),
            'final_physical_amount' => null,
            'calculated_balance' => $this->faker->numberBetween(50000, 200000),
            'total_income' => 0.00,
            'total_expenses' => 0.00,
            'difference' => null,
            'status' => 'open',
            'difference_justification' => null,
            'authorized_by' => null,
        ];
    }

    public function closed(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'closed',
                'closing_date' => now(),
                'final_physical_amount' => $attributes['calculated_balance'],
            ];
        });
    }
}
