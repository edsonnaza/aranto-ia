<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Administrador',
            'email' => 'admin@aranto.com',
            'password' => Hash::make('4r4nt0'),
        ]);

        User::factory()->create([
            'name' => 'Cajero',
            'email' => 'cajero@aranto.com',
            'password' => Hash::make('4r4nt0'),
        ]);

        $this->call([
            ServiceSeeder::class,
            RolesAndPermissionsSeeder::class,
        ]);
    }
}
