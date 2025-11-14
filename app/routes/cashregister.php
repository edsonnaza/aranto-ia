<?php

use App\Http\Controllers\CashRegisterController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    // Cash Register Dashboard
    Route::get('cash-register', [CashRegisterController::class, 'index'])
        ->name('cash-register.index')
        ->middleware('permission:cash_register.view');

    // Session Management
    Route::post('cash-register/open', [CashRegisterController::class, 'open'])
        ->name('cash-register.open')
        ->middleware('permission:cash_register.open');

    Route::post('cash-register/close', [CashRegisterController::class, 'close'])
        ->name('cash-register.close')
        ->middleware('permission:cash_register.close');

    // Transaction Processing
    Route::post('cash-register/payment', [CashRegisterController::class, 'processPayment'])
        ->name('cash-register.process-payment')
        ->middleware('permission:cash_register.process_payments');

    Route::post('cash-register/income', [CashRegisterController::class, 'registerIncome'])
        ->name('cash-register.register-income')
        ->middleware('permission:cash_register.register_income');

    Route::post('cash-register/expense', [CashRegisterController::class, 'registerExpense'])
        ->name('cash-register.register-expense')
        ->middleware('permission:cash_register.register_expense');

    // Reports and History
    Route::get('cash-register/history', [CashRegisterController::class, 'history'])
        ->name('cash-register.history')
        ->middleware('permission:cash_register.view_history');

    // Services Management
    Route::get('cash-register/services', [CashRegisterController::class, 'services'])
        ->name('cash-register.services')
        ->middleware('permission:services.view');

    // Service Payment Management
    Route::get('cash-register/pending-services', [CashRegisterController::class, 'pendingServices'])
        ->name('cash-register.pending-services')
        ->middleware('permission:cash_register.view');

    Route::post('cash-register/process-service-payment', [CashRegisterController::class, 'processServicePayment'])
        ->name('cash-register.process-service-payment')
        ->middleware('permission:cash_register.process_payments');
});