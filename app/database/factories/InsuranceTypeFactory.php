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
            'name' => 'Insurance Type ' . mt_rand(1000, 9999),
            'code' => 'INS-' . str_pad((string) mt_rand(0, 999), 3, '0', STR_PAD_LEFT),
            'description' => 'Description for insurance type ' . mt_rand(1, 999),
            'coverage_percentage' => fake()->randomFloat(2, 50, 100),
            'deductible_amount' => fake()->randomFloat(2, 0, 50000),
            'status' => 'active',
        ];
    }

    /**
     * Indica un tipo de seguro inactivo.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }

    /**
     * Indica un tipo de seguro activo.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
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
