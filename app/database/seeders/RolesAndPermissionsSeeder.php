<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
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
            Permission::firstOrCreate(['name' => $p]);
        }

        $admin = Role::firstOrCreate(['name' => 'admin']);
        $doctor = Role::firstOrCreate(['name' => 'doctor']);
        $nurse = Role::firstOrCreate(['name' => 'nurse']);
        $receptionist = Role::firstOrCreate(['name' => 'receptionist']);
        $viewer = Role::firstOrCreate(['name' => 'viewer']);

        $admin->givePermissionTo(Permission::all());
        $doctor->givePermissionTo([
            'patient.view','medical.record.view','medical.record.create',
            'medical.record.update','medical.record.amend',
            'medical.record.attachments.upload','prescription.create','prescription.view'
        ]);
        $nurse->givePermissionTo(['patient.view','medical.record.view','prescription.view']);
        $receptionist->givePermissionTo(['patient.view','medical.record.view']);
        $viewer->givePermissionTo(['patient.view','medical.record.view']);
    }
}
