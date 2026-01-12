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
        $firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Rosa', 'Luis', 'Isabel', 'Miguel', 'Carmen'];
        $lastNames = ['García', 'Rodríguez', 'Martínez', 'Hernández', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres'];
        $cities = ['Asunción', 'Encarnación', 'Ciudad del Este', 'Villarrica', 'Coronel Oviedo', 'Caaguazú', 'Salto del Guairá', 'Concepción', 'Pedro Juan Caballero', 'Caazapá'];
        $states = ['Alto Paraná', 'Amambay', 'Caaguazú', 'Caazapá', 'Canindeyú', 'Central', 'Concepción', 'Corrientes', 'Guairá', 'Itapúa'];

        return [
            'document_type' => collect(['CI', 'PASSPORT', 'OTHER'])->random(),
            'document_number' => (string) mt_rand(1000000000, 9999999999),
            'first_name' => $firstNames[array_rand($firstNames)],
            'last_name' => $lastNames[array_rand($lastNames)],
            'birth_date' => fake()->dateTimeBetween('-80 years', '-18 years'),
            'gender' => collect(['M', 'F'])->random(),
            'phone' => '+595 ' . mt_rand(900, 999) . ' ' . mt_rand(100000, 999999),
            'email' => strtolower($firstNames[array_rand($firstNames)] . '.' . $lastNames[array_rand($lastNames)] . '@example.com'),
            'address' => 'Calle ' . mt_rand(1, 100) . ' Nro. ' . mt_rand(100, 9999),
            'city' => $cities[array_rand($cities)],
            'state' => $states[array_rand($states)],
            'postal_code' => str_pad((string) mt_rand(0, 99999), 5, '0', STR_PAD_LEFT),
            'emergency_contact_name' => $firstNames[array_rand($firstNames)] . ' ' . $lastNames[array_rand($lastNames)],
            'emergency_contact_phone' => '+595 ' . mt_rand(900, 999) . ' ' . mt_rand(100000, 999999),
            'insurance_type_id' => InsuranceType::factory(),
            'insurance_number' => 'INS-' . str_pad((string) mt_rand(0, 999999), 6, '0', STR_PAD_LEFT),
            'insurance_valid_until' => fake()->dateTimeBetween('now', '+3 years'),
            'insurance_coverage_percentage' => fake()->randomFloat(2, 50, 100),
            'status' => 'active',
            'notes' => null,
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
     * Paciente activo.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
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
