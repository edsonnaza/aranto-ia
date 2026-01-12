<?php

namespace Database\Factories;

use App\Models\Professional;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Professional>
 */
class ProfessionalFactory extends Factory
{
    protected $model = Professional::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'document_type' => 'CI',
            'document_number' => $this->faker->unique()->numerify('########'),
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'birth_date' => $this->faker->dateTimeBetween('-70 years', '-25 years'),
            'phone' => $this->faker->phoneNumber(),
            'email' => $this->faker->unique()->safeEmail(),
            'address' => $this->faker->address(),
            'professional_license' => $this->faker->unique()->bothify('LIC-######'),
            'license_expiry_date' => $this->faker->dateTimeBetween('now', '+5 years'),
            'title' => $this->faker->randomElement(['Dr.', 'Lic.', 'Prof.', 'Dra.']),
            'commission_percentage' => $this->faker->randomFloat(2, 5, 30),
            'commission_calculation_method' => $this->faker->randomElement(['percentage', 'fixed_amount', 'custom']),
            'status' => 'active',
            'hire_date' => $this->faker->dateTimeBetween('-10 years', 'now'),
            'termination_date' => null,
        ];
    }

    /**
     * Profesional inactivo.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }

    /**
     * Profesional con licencia vencida.
     */
    public function withExpiredLicense(): static
    {
        return $this->state(fn (array $attributes) => [
            'license_expiry_date' => $this->faker->dateTimeBetween('-1 year', 'now'),
        ]);
    }

    /**
     * Profesional con licencia válida.
     */
    public function withValidLicense(): static
    {
        return $this->state(fn (array $attributes) => [
            'license_expiry_date' => $this->faker->dateTimeBetween('now', '+5 years'),
        ]);
    }

    /**
     * Profesional terminado.
     */
    public function terminated(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
            'termination_date' => $this->faker->dateTimeBetween('-2 years', 'now'),
        ]);
    }

    /**
     * Profesional con comisión por porcentaje.
     */
    public function withPercentageCommission(float $percentage = 20.0): static
    {
        return $this->state(fn (array $attributes) => [
            'commission_percentage' => $percentage,
            'commission_calculation_method' => 'percentage',
        ]);
    }

    /**
     * Profesional con comisión fija.
     */
    public function withFixedCommission(float $amount = 50.00): static
    {
        return $this->state(fn (array $attributes) => [
            'commission_percentage' => $amount,
            'commission_calculation_method' => 'fixed_amount',
        ]);
    }
}
