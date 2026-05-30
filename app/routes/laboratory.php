<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Laboratory\LabSampleController;
use App\Http\Controllers\Laboratory\LabResultController;
use App\Http\Controllers\Laboratory\LabValidationController;

Route::middleware(['auth', 'verified'])
    ->prefix('medical/laboratory')
    ->name('medical.laboratory.')
    ->group(function () {
        Route::resource('samples', LabSampleController::class);
        Route::resource('results', LabResultController::class);
        Route::resource('validations', LabValidationController::class);
    });
