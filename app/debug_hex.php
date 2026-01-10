<?php
require 'bootstrap/app.php';

use Illuminate\Support\Facades\DB;

// Conectar a la BD legacy
$legacyDb = DB::connection('legacy');

// Obtener registros que tienen ACOMPA
$result = $legacyDb->select("SELECT Nombre, HEX(Nombre) as hex_nombre FROM producto WHERE Nombre LIKE '%ACOMPA%' LIMIT 10");

foreach ($result as $row) {
    echo "=== REGISTRO LEGACY ===" . PHP_EOL;
    echo "Nombre: " . $row->Nombre . PHP_EOL;
    echo "Hex: " . $row->hex_nombre . PHP_EOL;
    echo "Longitud: " . strlen($row->Nombre) . " caracteres" . PHP_EOL;
    
    // Mostrar byte a byte
    echo "Bytes: ";
    for ($i = 0; $i < strlen($row->Nombre); $i++) {
        $byte = bin2hex($row->Nombre[$i]);
        echo "0x$byte ";
    }
    echo PHP_EOL;
    echo PHP_EOL;
}
?>
