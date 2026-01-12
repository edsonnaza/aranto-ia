<?php

namespace Database\Factories;

use App\Models\InsuranceType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InsuranceType>
 */
class InsuranceTypeFactory extends Factory
{
    protected $model = InsuranceType::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->company(),
            'code' => $this->faker->unique()->bothify('INS-###'),
            'description' => $this->faker->sentence(),
            'coverage_percentage' => $this->faker->randomFloat(2, 50, 100),
            'deductible_amount' => $this->faker->randomFloat(2, 0, 50000),
            'active' => true,
        ];
    }

    /**
     * Indica un tipo de seguro inactivo.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'active' => false,
        ]);
    }

    /**
     * Full coverage.
     */
    public function fullCoverage(): static
    {
        return $this->state(fn (array $attributes) => [
            'coverage_percentage' => 100.00,
        ]);
    }
}
