Auth::loginUsingId(1);
$c = app(\App\Http\Controllers\CashRegisterController::class);
$req = Illuminate\Http\Request::create('/cash-register/refund-service-payment','POST', ['service_request_id'=>4,'transaction_id'=>1,'amount'=>150000,'reason'=>'Prueba desde tinker']);
$resp = $c->refundServicePayment($req);
if ($resp instanceof Illuminate\Http\JsonResponse) { echo $resp->getContent(); } else { var_dump($resp); }
