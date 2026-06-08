<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Siembra roles y permisos (RBAC) de forma idempotente y segura.
 *
 * A diferencia de MasterLegacyMigrationSeeder, este seeder NO toca datos legacy
 * ni usa consultas específicas de MySQL (INFORMATION_SCHEMA), por lo que puede
 * ejecutarse en cada despliegue sin riesgo:
 *
 *   php artisan db:seed --class=AccessControlSeeder --force
 *
 * Agrupa los seeders de roles/permisos de navegación, caja y laboratorio
 * (incluye los roles laboratory, lab-technician, lab-biochemist, lab-supervisor).
 */
class AccessControlSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(NavigationPermissionsSeeder::class);
        $this->call(CashRegisterPermissionsSeeder::class);
        $this->call(LaboratoryRolesSeeder::class);

        // Permiso de auditoría (replica el bloque RBAC de FASE 1 del seeder maestro)
        $auditPerm = Permission::firstOrCreate([
            'name' => 'access-audit-logs',
            'guard_name' => 'web',
        ]);

        foreach (['super-admin', 'admin', 'accountant'] as $roleName) {
            Role::where('name', $roleName)->first()?->givePermissionTo($auditPerm);
        }

        // Limpiar la caché de permisos de Spatie para que los cambios se reflejen de inmediato
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
