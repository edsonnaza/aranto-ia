<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Siembra el catálogo de servicios de laboratorio de forma idempotente y segura.
 *
 * Inserta los servicios de laboratorio (medical_services) con sus códigos
 * (LAB-HEM-001, LAB-HCT-001, ...) y sus precios por seguro (service_prices).
 * No toca datos legacy ni usa consultas específicas de MySQL, por lo que puede
 * ejecutarse en cada despliegue:
 *
 *   php artisan db:seed --class=LaboratoryCatalogSeeder --force
 *
 * Depende de que exista el seguro PARTICULAR, por eso primero corre
 * InsuranceTypesSeeder (también idempotente).
 */
class LaboratoryCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(InsuranceTypesSeeder::class);
        $this->call(LaboratoryServicesSeeder::class);
    }
}
