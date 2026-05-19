<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\MedicalRecord;
use App\Policies\MedicalRecordPolicy;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        MedicalRecord::class => MedicalRecordPolicy::class,
    ];

    public function boot()
    {
        $this->registerPolicies();
    }
}
