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
                'role' => 'super_admin',
            ],
            [
                'name' => 'Dr. Juan Pérez',
                'email' => 'doctor@aranto.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'admin',
            ],
            [
                'name' => 'María González',
                'email' => 'cajero@aranto.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'cajero', // Specific role for detailed permissions
            ],
            [
                'name' => 'Carlos Supervisor',
                'email' => 'supervisor@aranto.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'supervisor',
            ],
            [
                'name' => 'Ana Auditor',
                'email' => 'auditor@aranto.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'auditor',
            ],
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];
            unset($userData['role']);

            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            // Assign specific role to user
            if (!$user->hasRole($role)) {
                $user->assignRole($role);
            }

            // For cashier, also assign navigation role
            if ($role === 'cajero' && !$user->hasRole('cashier')) {
                $user->assignRole('cashier');
            }
        }

        $this->command->info('Cash register users created successfully.');
    }
}