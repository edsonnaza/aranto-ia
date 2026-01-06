<?php
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/bootstrap/app.php';

use Illuminate\Support\Facades\DB;

$corrupted = DB::table('services')
    ->whereRaw("name LIKE '%¿%'")
    ->select('id', 'name')
    ->limit(20)
    ->get();

echo "Servicios con caracteres corruptos: " . count($corrupted) . "\n\n";

foreach ($corrupted as $service) {
    echo "ID: " . $service->id . " | " . $service->name . "\n";
}

$total = DB::table('services')->whereRaw("name LIKE '%¿%'")->count();
echo "\nTotal: " . $total . "\n";
