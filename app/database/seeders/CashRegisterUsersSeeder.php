<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class CashRegisterUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Super Administrador',
                'email' => 'admin@aranto.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'super-admin', // Coincide con NavigationPermissionsSeeder
                'spatie_role' => 'super_admin', // Role de Spatie
            ],
            [
                'name' => 'Dr. Juan Pérez',
                'email' => 'doctor@aranto.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'admin', // Coincide con NavigationPermissionsSeeder
                'spatie_role' => 'admin', // Role de Spatie
            ],
            [
                'name' => 'María González',
                'email' => 'cajero@aranto.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'cashier', // Coincide con NavigationPermissionsSeeder (cashier, no cajero)
                'spatie_role' => 'cajero', // Role de Spatie
            ],
            [
                'name' => 'Carlos Supervisor',
                'email' => 'supervisor@aranto.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'accountant', // Cambiar a rol existente en NavigationPermissionsSeeder
                'spatie_role' => 'supervisor', // Role de Spatie
            ],
            [
                'name' => 'Ana Auditor',
                'email' => 'auditor@aranto.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'viewer', // Cambiar a rol existente en NavigationPermissionsSeeder
                'spatie_role' => 'auditor', // Role de Spatie
            ],
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];
            $spatieRole = $userData['spatie_role'] ?? null;
            unset($userData['role'], $userData['spatie_role']);

            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            // Assign role from navigation permissions seeder
            if (!$user->hasRole($role)) {
                $user->assignRole($role);
            }

            // Assign Spatie role for cash register permissions
            if ($spatieRole && !$user->hasRole($spatieRole)) {
                $spatieRoleObj = Role::firstOrCreate([
                    'name' => $spatieRole,
                    'guard_name' => 'web',
                ]);
                $user->assignRole($spatieRoleObj);
            }
        }

        $this->command->info('Cash register users created successfully with Spatie roles.');
    }
}