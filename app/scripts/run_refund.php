<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

// Login as user 1
Auth::loginUsingId(1);

// Resolve controller
$c = $app->make(\App\Http\Controllers\CashRegisterController::class);

$req = Request::create('/cash-register/refund-service-payment','POST', ['service_request_id'=>4,'transaction_id'=>1,'amount'=>150000,'reason'=>'Prueba desde script']);

$resp = $c->refundServicePayment($req);

if ($resp instanceof Illuminate\Http\JsonResponse) {
    echo $resp->getContent();
} else {
    var_dump($resp);
}
