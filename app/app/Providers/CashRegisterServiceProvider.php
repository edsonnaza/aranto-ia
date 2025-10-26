<?php

namespace App\Providers;

use App\Services\AuditService;
use App\Services\CashRegisterService;
use App\Services\PaymentService;
use Illuminate\Support\ServiceProvider;

class CashRegisterServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Registrar servicios como singletons
        $this->app->singleton(CashRegisterService::class, function ($app) {
            return new CashRegisterService();
        });

        $this->app->singleton(PaymentService::class, function ($app) {
            return new PaymentService();
        });

        $this->app->singleton(AuditService::class, function ($app) {
            return new AuditService();
        });

        // Aliases para facilitar el acceso
        $this->app->alias(CashRegisterService::class, 'cash-register');
        $this->app->alias(PaymentService::class, 'payment');
        $this->app->alias(AuditService::class, 'audit');
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
