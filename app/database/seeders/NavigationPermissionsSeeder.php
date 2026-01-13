<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class NavigationPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create navigation permissions (module-level access)
        $navigationPermissions = [
            'access-treasury' => 'Acceso al módulo de Tesorería',
            'access-commissions' => 'Acceso al módulo de Comisiones',
            'access-medical-system' => 'Acceso al Sistema Médico',
            'access-reports' => 'Acceso al módulo de Reportes',
            'access-settings' => 'Acceso al módulo de Configuración',
            'access-user-management' => 'Acceso a la gestión de usuarios',
            'access-audit-logs' => 'Acceso a los registros de auditoría',
        ];

        foreach ($navigationPermissions as $name => $description) {
            Permission::firstOrCreate([
                'name' => $name,
                'guard_name' => 'web',
            ]);
        }

        // Create roles for navigation access
        $navigationRoles = [
            'super-admin' => [
                'display_name' => 'Super Administrador',
                'description' => 'Acceso completo a todos los módulos',
                'permissions' => [
                    'access-treasury',
                    'access-commissions',
                    'access-medical-system',
                    'access-reports',
                    'access-settings',
                    'access-user-management',
                    'access-audit-logs',
                ],
            ],
            'admin' => [
                'display_name' => 'Administrador',
                'description' => 'Administrador general',
                'permissions' => [
                    'access-treasury',
                    'access-commissions',
                    'access-medical-system',
                    'access-reports',
                    'access-audit-logs',
                ],
            ],
            'cashier' => [
                'display_name' => 'Cajero',
                'description' => 'Operador de caja registradora',
                'permissions' => [
                    'access-treasury',
                ],
            ],
            'medical-staff' => [
                'display_name' => 'Personal Médico',
                'description' => 'Personal médico autorizado',
                'permissions' => [
                    'access-medical-system',
                ],
            ],
            'receptionist' => [
                'display_name' => 'Recepcionista',
                'description' => 'Personal de recepción',
                'permissions' => [
                    'access-medical-system',
                ],
            ],
            'viewer' => [
                'display_name' => 'Visualizador',
                'description' => 'Solo acceso a reportes',
                'permissions' => [
                    'access-reports',
                ],
            ],
            'accountant' => [
                'display_name' => 'Contador',
                'description' => 'Gestión de comisiones y reportes financieros',
                'permissions' => [
                    'access-commissions',
                    'access-reports',
                    'access-audit-logs',
                ],
            ],
        ];

        foreach ($navigationRoles as $roleName => $roleData) {
            $role = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ]);

            // Assign permissions to role
            $permissions = Permission::whereIn('name', $roleData['permissions'])->get();
            $role->syncPermissions($permissions);
        }

        $this->command->info('Navigation permissions and roles created successfully.');
    }
}