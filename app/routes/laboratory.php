<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Laboratory\LabDashboardController;
use App\Http\Controllers\Laboratory\LabSampleController;
use App\Http\Controllers\Laboratory\LabSampleTypeController;
use App\Http\Controllers\Laboratory\LabTestRequestController;
use App\Http\Controllers\Laboratory\LabWorksheetController;
use App\Http\Controllers\Laboratory\LabResultController;
use App\Http\Controllers\Laboratory\LabValidationController;

Route::middleware(['auth', 'verified'])
    ->prefix('medical/laboratory')
    ->name('medical.laboratory.')
    ->group(function () {
        // Dashboard
        Route::get('/', [LabDashboardController::class, 'index'])->name('dashboard');
        
        // Sample Types
        Route::resource('sample-types', LabSampleTypeController::class);
        
        // Samples
        Route::resource('samples', LabSampleController::class);
        
        // Test Requests
        Route::resource('test-requests', LabTestRequestController::class);
        Route::post('test-requests/{testRequest}/assign', [LabTestRequestController::class, 'assign'])->name('test-requests.assign');
        Route::post('test-requests/{testRequest}/start', [LabTestRequestController::class, 'start'])->name('test-requests.start');
        Route::post('test-requests/{testRequest}/complete', [LabTestRequestController::class, 'complete'])->name('test-requests.complete');
        Route::post('test-requests/{testRequest}/cancel', [LabTestRequestController::class, 'cancel'])->name('test-requests.cancel');
        
        // Worksheets
        Route::resource('worksheets', LabWorksheetController::class);
        Route::post('worksheets/{worksheet}/start', [LabWorksheetController::class, 'start'])->name('worksheets.start');
        Route::post('worksheets/{worksheet}/complete', [LabWorksheetController::class, 'complete'])->name('worksheets.complete');
        Route::post('worksheets/{worksheet}/cancel', [LabWorksheetController::class, 'cancel'])->name('worksheets.cancel');
        
        // Results
        Route::resource('results', LabResultController::class);
        
        // Validations
        Route::resource('validations', LabValidationController::class);
    });

