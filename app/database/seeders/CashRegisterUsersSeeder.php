<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

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
            ],
            [
                'name' => 'Dr. Juan Pérez',
                'email' => 'doctor@aranto.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'admin', // Coincide con NavigationPermissionsSeeder
            ],
            [
                'name' => 'María González',
                'email' => 'cajero@aranto.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'cashier', // Coincide con NavigationPermissionsSeeder (cashier, no cajero)
            ],
            [
                'name' => 'Carlos Supervisor',
                'email' => 'supervisor@aranto.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'accountant', // Cambiar a rol existente en NavigationPermissionsSeeder
            ],
            [
                'name' => 'Ana Auditor',
                'email' => 'auditor@aranto.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'viewer', // Cambiar a rol existente en NavigationPermissionsSeeder
            ],
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];
            unset($userData['role']);

            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            // Assign role from navigation permissions seeder
            if (!$user->hasRole($role)) {
                $user->assignRole($role);
            }
        }

        $this->command->info('Cash register users created successfully.');
    }
}