<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DoctorTestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Asegurar permisos necesarios para el módulo de Historia Clínica
        $permissions = [
            'patient.view',
            'patient.update',
            'medical.record.view',
            'medical.record.create',
            'medical.record.update',
            'medical.record.delete',
            'medical.record.amend',
            'medical.record.attachments.upload',
            'prescription.create',
            'prescription.view',
        ];

        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p], ['guard_name' => 'web']);
        }

        // Asegurar role 'doctor' y asignar permisos médicos
        $doctor = Role::firstOrCreate(['name' => 'doctor']);
        $doctor->givePermissionTo([
            'patient.view',
            'medical.record.view',
            'medical.record.create',
            'medical.record.update',
            'medical.record.amend',
            'medical.record.attachments.upload',
            'prescription.create',
            'prescription.view',
        ]);

        // Crear/asegurar usuario de prueba doctor
        $email = 'doctor@aranto.com';
        $user = User::firstOrNew(['email' => $email]);
        $isNew = !$user->exists;

        $user->name = $user->name ?: 'Doctor Test';
        if ($isNew) {
            $user->password = Hash::make('password');
        }

        $user->save();

        if (!$user->hasRole('doctor')) {
            $user->assignRole($doctor);
        }

        $this->command->info("Usuario doctor asegurado: {$email} (password: password)");
    }
}
