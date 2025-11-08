<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed permissions and roles first
        $this->call([
            NavigationPermissionsSeeder::class,
            CashRegisterPermissionsSeeder::class,
            ServicesSeeder::class,
            CashRegisterUsersSeeder::class,
            
            // New medical system seeders
            InsuranceTypesSeeder::class,
            ServiceCategoriesSeeder::class,
            MedicalServicesSeeder::class,
        ]);

        // Create default test user if not using cash register users
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
    }
}
