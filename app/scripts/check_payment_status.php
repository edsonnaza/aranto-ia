<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ServiceRequest;

$nums = ['REQ-2025-000004', 'REQ-2025-000003'];
foreach ($nums as $n) {
    $s = ServiceRequest::where('request_number', $n)->first();
    if ($s) {
        echo $n . ': payment_status=' . $s->payment_status . ' status=' . $s->status . ' paid_amount=' . $s->paid_amount . "\n";
    } else {
        echo $n . ': not found\n';
    }
}
