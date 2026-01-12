<?php

namespace Database\Factories;

use App\Models\Patient;
use App\Models\InsuranceType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Patient>
 */
class PatientFactory extends Factory
{
    protected $model = Patient::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'document_type' => $this->faker->randomElement(['CI', 'PASSPORT', 'OTHER']),
            'document_number' => $this->faker->unique()->numerify('##########'),
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'birth_date' => $this->faker->dateTimeBetween('-80 years', '-18 years'),
            'gender' => $this->faker->randomElement(['M', 'F']),
            'phone' => $this->faker->phoneNumber(),
            'email' => $this->faker->unique()->safeEmail(),
            'address' => $this->faker->address(),
            'city' => $this->faker->city(),
            'state' => $this->faker->state(),
            'postal_code' => $this->faker->postcode(),
            'emergency_contact_name' => $this->faker->name(),
            'emergency_contact_phone' => $this->faker->phoneNumber(),
            'insurance_type_id' => InsuranceType::factory(),
            'insurance_number' => $this->faker->bothify('INS-######'),
            'insurance_valid_until' => $this->faker->dateTimeBetween('now', '+3 years'),
            'insurance_coverage_percentage' => $this->faker->randomFloat(2, 50, 100),
            'status' => 'active',
            'notes' => $this->faker->optional()->paragraph(),
        ];
    }

    /**
     * Paciente inactivo.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }

    /**
     * Paciente sin seguro.
     */
    public function withoutInsurance(): static
    {
        return $this->state(fn (array $attributes) => [
            'insurance_type_id' => null,
            'insurance_number' => null,
            'insurance_valid_until' => null,
            'insurance_coverage_percentage' => 0.00,
        ]);
    }

    /**
     * Paciente con un seguro específico.
     */
    public function withInsurance(InsuranceType $insurance): static
    {
        return $this->state(fn (array $attributes) => [
            'insurance_type_id' => $insurance->id,
        ]);
    }

    /**
     * Paciente con seguro vencido.
     */
    public function withExpiredInsurance(): static
    {
        return $this->state(fn (array $attributes) => [
            'insurance_valid_until' => $this->faker->dateTimeBetween('-1 year', 'now'),
        ]);
    }

    /**
     * Paciente de género masculino.
     */
    public function male(): static
    {
        return $this->state(fn (array $attributes) => [
            'gender' => 'M',
        ]);
    }

    /**
     * Paciente de género femenino.
     */
    public function female(): static
    {
        return $this->state(fn (array $attributes) => [
            'gender' => 'F',
        ]);
    }
}
