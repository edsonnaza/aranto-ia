<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class LaboratoryRolesSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'lab-technician' => [
                'name' => 'Técnico de Laboratorio',
                'permissions' => [
                    'view-lab-samples',
                    'create-lab-samples',
                    'collect-lab-samples',
                    'receive-lab-samples',
                    'reject-lab-samples',
                    'start-lab-analysis',
                    'view-lab-results',
                    'create-lab-results',
                    'edit-lab-results-draft',
                ],
            ],
            'lab-biochemist' => [
                'name' => 'Bioquímico/a',
                'permissions' => [
                    'view-lab-samples',
                    'view-lab-results',
                    'edit-lab-results-draft',
                    'validate-lab-results',
                    'approve-lab-results',
                    'generate-lab-reports',
                ],
            ],
            'lab-supervisor' => [
                'name' => 'Supervisor de Laboratorio',
                'permissions' => [
                    'view-lab-samples',
                    'create-lab-samples',
                    'collect-lab-samples',
                    'receive-lab-samples',
                    'reject-lab-samples',
                    'start-lab-analysis',
                    'view-lab-results',
                    'create-lab-results',
                    'edit-lab-results-draft',
                    'validate-lab-results',
                    'approve-lab-results',
                    'generate-lab-reports',
                    'manage-lab-equipment',
                    'manage-lab-profiles',
                ],
            ],
        ];

        foreach ($roles as $roleKey => $roleData) {
            $role = Role::firstOrCreate(
                ['name' => $roleKey, 'guard_name' => 'web']
            );

            foreach ($roleData['permissions'] as $permissionName) {
                $permission = Permission::firstOrCreate(
                    ['name' => $permissionName, 'guard_name' => 'web']
                );

                $role->givePermissionTo($permission);
            }

            echo "✅ Rol '{$roleData['name']}' creado con " . count($roleData['permissions']) . " permisos\n";
        }
    }
}
