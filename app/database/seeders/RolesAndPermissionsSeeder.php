<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Crear permisos para el módulo de caja
        $permissions = [
            // Sesiones de caja
            'cash_register.open' => 'Abrir sesión de caja',
            'cash_register.close' => 'Cerrar sesión de caja',
            'cash_register.view_own' => 'Ver propias sesiones de caja',
            'cash_register.view_all' => 'Ver todas las sesiones de caja',
            'cash_register.authorize_differences' => 'Autorizar diferencias en caja',

            // Transacciones y pagos
            'payments.process' => 'Procesar pagos',
            'payments.view' => 'Ver pagos',
            'transactions.cancel' => 'Cancelar transacciones',
            'transactions.view_all' => 'Ver todas las transacciones',

            // Servicios médicos
            'services.view' => 'Ver servicios médicos',
            'services.manage' => 'Gestionar servicios médicos',
            'services.pricing' => 'Modificar precios de servicios',

            // Reportes y auditoría
            'audit.view_reports' => 'Ver reportes de auditoría',
            'audit.view_logs' => 'Ver logs de auditoría',
            'audit.export_data' => 'Exportar datos de auditoría',

            // Administración de usuarios
            'users.view' => 'Ver usuarios',
            'users.manage' => 'Gestionar usuarios',
            'users.assign_roles' => 'Asignar roles a usuarios',

            // Liquidaciones de comisiones
            'commissions.process' => 'Procesar liquidaciones de comisiones',
            'commissions.view' => 'Ver liquidaciones de comisiones',

            // Proveedores y gastos
            'suppliers.payments' => 'Realizar pagos a proveedores',
            'expenses.process' => 'Procesar gastos',
        ];

        foreach ($permissions as $permission => $description) {
            Permission::create([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        // Crear roles
        $adminRole = Role::create(['name' => 'Administrador']);
        $cashierRole = Role::create(['name' => 'Cajero']);
        $auditorRole = Role::create(['name' => 'Auditor']);
        $managerRole = Role::create(['name' => 'Gerente']);

        // Asignar permisos a roles

        // Administrador: todos los permisos
        $adminRole->givePermissionTo(Permission::all());

        // Cajero: permisos básicos de caja
        $cashierRole->givePermissionTo([
            'cash_register.open',
            'cash_register.close',
            'cash_register.view_own',
            'payments.process',
            'payments.view',
            'services.view',
            'transactions.cancel',
            'commissions.process',
            'suppliers.payments',
            'expenses.process',
        ]);

        // Auditor: solo lectura y reportes
        $auditorRole->givePermissionTo([
            'cash_register.view_all',
            'payments.view',
            'transactions.view_all',
            'audit.view_reports',
            'audit.view_logs',
            'audit.export_data',
            'services.view',
            'commissions.view',
            'users.view',
        ]);

        // Gerente: permisos de supervisión
        $managerRole->givePermissionTo([
            'cash_register.view_all',
            'cash_register.authorize_differences',
            'payments.view',
            'transactions.view_all',
            'transactions.cancel',
            'audit.view_reports',
            'audit.view_logs',
            'services.view',
            'services.manage',
            'commissions.view',
            'commissions.process',
            'users.view',
            'suppliers.payments',
            'expenses.process',
        ]);

        // Asignar roles a usuarios existentes
        $adminUser = User::where('email', 'admin@aranto.com')->first();
        if ($adminUser) {
            $adminUser->assignRole('Administrador');
        }

        $cashierUser = User::where('email', 'cajero@aranto.com')->first();
        if ($cashierUser) {
            $cashierUser->assignRole('Cajero');
        }

        echo "Roles y permisos creados exitosamente:\n";
        echo "- Administrador: " . Permission::count() . " permisos\n";
        echo "- Cajero: " . $cashierRole->permissions->count() . " permisos\n";
        echo "- Auditor: " . $auditorRole->permissions->count() . " permisos\n";
        echo "- Gerente: " . $managerRole->permissions->count() . " permisos\n";
    }
}
