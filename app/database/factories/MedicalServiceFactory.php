<?php

namespace Database\Factories;

use App\Models\MedicalService;
use App\Models\ServiceCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MedicalService>
 */
class MedicalServiceFactory extends Factory
{
    protected $model = MedicalService::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->words(3, true),
            'code' => $this->faker->unique()->bothify('SVC-###??'),
            'description' => $this->faker->sentence(),
            'category_id' => ServiceCategory::factory(),
            'duration_minutes' => $this->faker->numberBetween(15, 120),
            'requires_appointment' => $this->faker->boolean(80), // 80% sí requieren cita
            'requires_preparation' => $this->faker->boolean(30), // 30% requieren preparación
            'preparation_instructions' => $this->faker->optional()->paragraph(),
            'default_commission_percentage' => $this->faker->randomFloat(2, 5, 25),
            'status' => 'active',
        ];
    }

    /**
     * Indica un servicio inactivo.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }

    /**
     * Servicio que requiere cita.
     */
    public function requiresAppointment(): static
    {
        return $this->state(fn (array $attributes) => [
            'requires_appointment' => true,
        ]);
    }

    /**
     * Servicio que requiere preparación.
     */
    public function requiresPreparation(): static
    {
        return $this->state(fn (array $attributes) => [
            'requires_preparation' => true,
            'preparation_instructions' => $this->faker->paragraph(),
        ]);
    }

    /**
     * Servicio sin cita requerida.
     */
    public function withoutAppointment(): static
    {
        return $this->state(fn (array $attributes) => [
            'requires_appointment' => false,
        ]);
    }

    /**
     * Especificar una categoría.
     */
    public function withCategory(ServiceCategory $category): static
    {
        return $this->state(fn (array $attributes) => [
            'category_id' => $category->id,
        ]);
    }
}
