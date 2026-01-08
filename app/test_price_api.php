<?php
require 'vendor/autoload.php';
require 'bootstrap/app.php';

use App\Models\MedicalService;
use App\Models\ServicePrice;
use Illuminate\Support\Carbon;

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Http\Kernel');
$kernel->bootstrap();

// Test service prices
$services = MedicalService::with('servicePrices')->limit(3)->get();

echo "=== Medical Services ===\n";
foreach ($services as $service) {
    echo "\nServicio: {$service->name} (ID: {$service->id})\n";
    echo "Base Price: {$service->base_price}\n";
    echo "Service Prices Count: " . $service->servicePrices->count() . "\n";
    
    // Show current prices
    $currentPrices = $service->currentPrices()->get();
    echo "Current Prices (with date filter): " . $currentPrices->count() . "\n";
    
    if ($currentPrices->count() > 0) {
        foreach ($currentPrices as $price) {
            echo "  - Insurance {$price->insurance_type_id}: ₲" . number_format($price->price, 0) . "\n";
        }
    } else if ($service->servicePrices->count() > 0) {
        echo "  No prices in valid date range. Available prices:\n";
        foreach ($service->servicePrices->take(2) as $price) {
            echo "    - Insurance {$price->insurance_type_id}: ₲" . number_format($price->price, 0) . 
                 " (from: {$price->effective_from}, until: {$price->effective_until})\n";
        }
    }
}

echo "\n=== Today's Date ===\n";
echo "Today: " . Carbon::now()->toDateString() . "\n";
