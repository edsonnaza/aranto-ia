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
 *  - Seeders legacy / destructivos: se agrupan en LegacyDataSeeder (ejecución
 *    manual): LegacyCategorySeeder (TRUNCATE), MigrateProductosFromLegacySeeder
 *    y PopulateLegacyServiceMappingsSeeder (requieren conexión `legacy`), más
 *    los *FromLegacySeeder que ya invoca MasterLegacyMigrationSeeder.
 *  - ServicesSeeder (vacío / no-op).
 *  - DoctorTestUserSeeder (solo entornos local/testing, lo llama DatabaseSeeder).
 */
class DeploySeeder extends Seeder
{
    public function run(): void
    {
        // 1. RBAC: permisos de navegación/caja + roles de laboratorio + auditoría,
        //    más permisos médicos (patient/medical-record/prescription).
        $this->call(AccessControlSeeder::class);
        $this->call(RolesAndPermissionsSeeder::class);

        // 2. Catálogo base de categorías de servicios médicos.
        $this->call(ServiceCategoriesSeeder::class);
        $this->call(CreateAdditionalServiceCategoriesSeeder::class);

        // 3. Seguros + servicios de laboratorio (medical_services + service_prices).
        $this->call(LaboratoryCatalogSeeder::class);

        // 4. Servicios médicos generales (consultas, ECG) + precios por seguro.
        $this->call(MedicalServicesSeeder::class);

        // 5. Catálogo clínico de laboratorio.
        $this->call(LabSampleTypeSeeder::class);
        $this->call(LabEquipmentSeeder::class);
        $this->call(LabTestProfileSeeder::class);
        $this->call(LabProfilesCoverageSeeder::class);
        $this->call(LabReferenceRangeSeeder::class);

        // 6. Usuarios de producción (no pisa contraseñas; solo agrega faltantes).
        //    Va al final para que todos los roles ya existan.
        $this->call(UsersProductionSeeder::class);
    }
}
