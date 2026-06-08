<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Seeder principal de DESPLIEGUE.
 *
 * Es el ÚNICO seeder que ejecuta `start.web.sh` en cada deploy. Agrupa todos
 * los seeders idempotentes y sin dependencia de la base legacy, de modo que
 * correrlo repetidamente es seguro (no duplica datos):
 *
 *   php artisan db:seed --class=DeploySeeder --force
 *
 * Orden importa: primero RBAC y catálogos base, luego los servicios de
 * laboratorio (de los que dependen los perfiles), y al final los rangos de
 * referencia (que dependen de los parámetros creados por los perfiles).
 *
 * NO se incluyen aquí (a propósito):
 *  - Seeders legacy (dependen de db_legacy_infomed / INFORMATION_SCHEMA):
 *    CreateAdditionalServiceCategoriesSeeder, LegacyCategorySeeder,
 *    MigrateProductosFromLegacySeeder, PopulateLegacyServiceMappingsSeeder,
 *    UsersProductionSeeder, *FromLegacySeeder.
 *  - Seeders obsoletos / huérfanos: RolesAndPermissionsSeeder (permisos no
 *    usados por la app), MedicalServicesSeeder (insert no idempotente),
 *    ServicesSeeder (vacío).
 *  - Seeders de prueba: DoctorTestUserSeeder (solo entornos locales).
 */
class DeploySeeder extends Seeder
{
    public function run(): void
    {
        // 1. RBAC: permisos de navegación/caja + roles de laboratorio + auditoría.
        $this->call(AccessControlSeeder::class);

        // 2. Catálogo base de categorías de servicios médicos.
        $this->call(ServiceCategoriesSeeder::class);

        // 3. Seguros + servicios de laboratorio (medical_services + service_prices).
        $this->call(LaboratoryCatalogSeeder::class);

        // 4. Catálogo clínico de laboratorio.
        $this->call(LabSampleTypeSeeder::class);
        $this->call(LabEquipmentSeeder::class);
        $this->call(LabTestProfileSeeder::class);
        $this->call(LabProfilesCoverageSeeder::class);
        $this->call(LabReferenceRangeSeeder::class);
    }
}
