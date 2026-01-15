<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

// Crear el permiso
$perm = Permission::firstOrCreate([
    'name' => 'access-audit-logs',
    'guard_name' => 'web',
]);

echo "✓ Permiso creado: {$perm->name}\n";

// Asignarlo a roles
$superAdmin = Role::where('name', 'super-admin')->first();
$admin = Role::where('name', 'admin')->first();
$accountant = Role::where('name', 'accountant')->first();

if ($superAdmin) {
    $superAdmin->givePermissionTo($perm);
    echo "✓ Permiso asignado a super-admin\n";
}

if ($admin) {
    $admin->givePermissionTo($perm);
    echo "✓ Permiso asignado a admin\n";
}

if ($accountant) {
    $accountant->givePermissionTo($perm);
    echo "✓ Permiso asignado a accountant\n";
}

echo "\n✅ Permisos de auditoría configurados correctamente\n";
