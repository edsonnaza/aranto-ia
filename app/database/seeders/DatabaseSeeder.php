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
        // Seed cash register permissions and roles first
        $this->call([
            CashRegisterPermissionsSeeder::class,
            ServicesSeeder::class,
            CashRegisterUsersSeeder::class,
        ]);

        // Create default test user if not using cash register users
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]
        );
    }
}
