<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\AuditLogController;

// Simular una request a /settings/audit
$request = Request::create('/settings/audit', 'GET');
$request->setUserResolver(function () {
    return \App\Models\User::first();
});

try {
    $controller = new AuditLogController();
    $response = $controller->index($request);
    echo "✓ Controlador ejecutado exitosamente\n";
    echo "Tipo de respuesta: " . get_class($response) . "\n";
} catch (\Exception $e) {
    echo "✗ Error en controlador:\n";
    echo "Mensaje: " . $e->getMessage() . "\n";
    echo "Archivo: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
