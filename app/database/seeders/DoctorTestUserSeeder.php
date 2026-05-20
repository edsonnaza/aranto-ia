<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Professional;
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

        // Asegurar que exista un perfil de Professional vinculado al usuario de prueba
        try {
            $professional = Professional::where('user_id', $user->id)
                ->orWhere('email', $email)
                ->first();

            if (!$professional) {
                $names = explode(' ', $user->name, 2);
                $first = $names[0] ?? 'Doctor';
                $last = $names[1] ?? 'Test';

                $professional = Professional::create([
                    'document_type' => 'CI',
                    'document_number' => 'SEED-' . $user->id,
                    'first_name' => $first,
                    'last_name' => $last,
                    'email' => $email,
                    'status' => 'active',
                    'commission_percentage' => 0.00,
                    'commission_calculation_method' => 'percentage',
                    'hire_date' => now(),
                ]);

                // vincular manualmente por si `user_id` no está en fillable
                $professional->user_id = $user->id;
                $professional->save();

                $this->command->info("Professional creado y vinculado al usuario: {$email}");
            } elseif (!$professional->user_id) {
                $professional->user_id = $user->id;
                $professional->save();
                $this->command->info("Professional existente vinculado al usuario: {$email}");
            }
        } catch (\Exception $e) {
            $this->command->warn('No se pudo crear/vincular el Professional de prueba: ' . $e->getMessage());
        }

        $this->command->info("Usuario doctor asegurado: {$email} (password: password)");
    }
}
