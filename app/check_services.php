<?php
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/bootstrap/app.php';

use Illuminate\Support\Facades\DB;

echo "\n" . str_repeat('═', 80) . "\n";
echo "ESTADO ACTUAL DE SERVICIOS CORRUPTOS\n";
echo str_repeat('═', 80) . "\n\n";

// Contar servicios con ¿
$countQuestion = DB::table('services')
    ->whereRaw("name LIKE '%¿%'")
    ->count();

echo "Servicios con ¿: " . $countQuestion . "\n\n";

// Buscar ejemplos
if ($countQuestion > 0) {
    $examples = DB::table('services')
        ->whereRaw("name LIKE '%¿%'")
        ->select('id', 'name')
        ->limit(10)
        ->get();

    echo "Ejemplos:\n";
    foreach ($examples as $ex) {
        echo "  ID " . $ex->id . ": " . $ex->name . "\n";
    }
    echo "\n";
}

// Buscar por Cauteri
$cauteri = DB::table('services')
    ->whereRaw("name LIKE '%Cauteri%'")
    ->select('id', 'name')
    ->limit(5)
    ->get();

echo "Servicios con 'Cauteri':\n";
foreach ($cauteri as $c) {
    echo "  ID " . $c->id . ": " . $c->name . "\n";
}

echo "\n" . str_repeat('═', 80) . "\n";
