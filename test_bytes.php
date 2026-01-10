<?php
// Script simple para ver los bytes del texto legacy

$testString = "ACOMPAÃ'AMIENTO DE RN A TRASLADO";

echo "Original: $testString" . PHP_EOL;
echo "Hex: " . bin2hex($testString) . PHP_EOL;
echo "Longitud: " . strlen($testString) . " bytes" . PHP_EOL;
echo PHP_EOL;

echo "Byte a byte:" . PHP_EOL;
for ($i = 0; $i < strlen($testString); $i++) {
    $char = $testString[$i];
    $hex = bin2hex($char);
    $decimal = ord($char);
    echo "Pos $i: 0x$hex (decimal $decimal) = '$char'" . PHP_EOL;
}
?>
