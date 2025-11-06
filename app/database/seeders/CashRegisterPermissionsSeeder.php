<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class CashRegisterPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permissions for cash register module
        $permissions = [
            // Cash Register Session Permissions
            'cash_register.view' => 'Ver módulo de caja registradora',
            'cash_register.open' => 'Abrir sesión de caja',
            'cash_register.close' => 'Cerrar sesión de caja',
            'cash_register.process_payments' => 'Procesar pagos de servicios',
            'cash_register.register_income' => 'Registrar ingresos',
            'cash_register.register_expense' => 'Registrar egresos',
            'cash_register.view_history' => 'Ver historial de transacciones',
            'cash_register.manage_sessions' => 'Gestionar sesiones de caja',
            
            // Services Permissions
            'services.view' => 'Ver servicios médicos',
            'services.create' => 'Crear servicios médicos',
            'services.edit' => 'Editar servicios médicos',
            'services.delete' => 'Eliminar servicios médicos',
            'services.manage' => 'Gestionar servicios médicos',
            
            // Reports Permissions
            'reports.cash_register' => 'Ver reportes de caja registradora',
            'reports.transactions' => 'Ver reportes de transacciones',
            'reports.daily_summary' => 'Ver resumen diario',
            'reports.monthly_summary' => 'Ver resumen mensual',
            
            // Audit Permissions
            'audit.view' => 'Ver auditoría del sistema',
            'audit.cash_register' => 'Ver auditoría de caja registradora',
            
            // Administrative Permissions
            'admin.cash_register' => 'Administrar módulo de caja',
            'admin.override_sessions' => 'Anular restricciones de sesión',
        ];

        foreach ($permissions as $name => $description) {
            Permission::firstOrCreate([
                'name' => $name,
                'guard_name' => 'web',
            ]);
        }

        // Create roles for cash register module
        $roles = [
            'super_admin' => [
                'display_name' => 'Super Administrador',
                'description' => 'Acceso completo al sistema',
                'permissions' => array_keys($permissions), // All permissions
            ],
            'admin' => [
                'display_name' => 'Administrador',
                'description' => 'Administrador de caja registradora',
                'permissions' => [
                    'cash_register.view',
                    'cash_register.open',
                    'cash_register.close',
                    'cash_register.process_payments',
                    'cash_register.register_income',
                    'cash_register.register_expense',
                    'cash_register.view_history',
                    'cash_register.manage_sessions',
                    'services.view',
                    'services.create',
                    'services.edit',
                    'services.manage',
                    'reports.cash_register',
                    'reports.transactions',
                    'reports.daily_summary',
                    'reports.monthly_summary',
                    'audit.view',
                    'audit.cash_register',
                    'admin.cash_register',
                ],
            ],
            'cajero' => [
                'display_name' => 'Cajero',
                'description' => 'Operador de caja registradora',
                'permissions' => [
                    'cash_register.view',
                    'cash_register.open',
                    'cash_register.close',
                    'cash_register.process_payments',
                    'cash_register.register_income',
                    'cash_register.register_expense',
                    'services.view',
                    'reports.daily_summary',
                ],
            ],
            'supervisor' => [
                'display_name' => 'Supervisor',
                'description' => 'Supervisor de operaciones de caja',
                'permissions' => [
                    'cash_register.view',
                    'cash_register.process_payments',
                    'cash_register.register_income',
                    'cash_register.register_expense',
                    'cash_register.view_history',
                    'services.view',
                    'services.edit',
                    'reports.cash_register',
                    'reports.transactions',
                    'reports.daily_summary',
                    'reports.monthly_summary',
                    'audit.view',
                ],
            ],
            'auditor' => [
                'display_name' => 'Auditor',
                'description' => 'Auditor de transacciones',
                'permissions' => [
                    'cash_register.view',
                    'cash_register.view_history',
                    'services.view',
                    'reports.cash_register',
                    'reports.transactions',
                    'reports.daily_summary',
                    'reports.monthly_summary',
                    'audit.view',
                    'audit.cash_register',
                ],
            ],
        ];

        foreach ($roles as $roleName => $roleData) {
            $role = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ]);

            // Assign permissions to role
            $permissions = Permission::whereIn('name', $roleData['permissions'])->get();
            $role->syncPermissions($permissions);
        }

        $this->command->info('Cash register permissions and roles created successfully.');
    }
}