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
        // Execute the master legacy migration seeder which includes all phases
        $this->call(MasterLegacyMigrationSeeder::class);

        // En entornos locales o de testing, asegurar usuario doctor para pruebas
        if (app()->environment('local') || app()->environment('testing')) {
            $this->call(DoctorTestUserSeeder::class);
        }
    }
}
