<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = \App\Models\User::where('email', 'admin@aranto.com')->first();
if ($user) {
    echo "Usuario: {$user->email}\n";
    echo "Roles:\n";
    foreach ($user->roles as $r) {
        echo "  - {$r->name}\n";
    }
    
    echo "\nPermisos totales:\n";
    foreach ($user->getAllPermissions() as $p) {
        echo "  ✓ {$p->name}\n";
    }
} else {
    echo "Usuario no encontrado\n";
}
