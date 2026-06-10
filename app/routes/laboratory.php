<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Laboratory\LabDashboardController;
use App\Http\Controllers\Laboratory\LabAreaController;
use App\Http\Controllers\Laboratory\LabEquipmentController;
use App\Http\Controllers\Laboratory\LabSampleController;
use App\Http\Controllers\Laboratory\LabSampleTypeController;
use App\Http\Controllers\Laboratory\LabTestProfileController;
use App\Http\Controllers\Laboratory\LabTestRequestController;
use App\Http\Controllers\Laboratory\LabWorksheetController;
use App\Http\Controllers\Laboratory\LabResultController;
use App\Http\Controllers\Laboratory\LabValidationController;
use App\Http\Controllers\Laboratory\LabReportController;

Route::middleware(['auth', 'verified'])
    ->prefix('medical/laboratory')
    ->name('medical.laboratory.')
    ->group(function () {
        // Dashboard
        Route::get('/', [LabDashboardController::class, 'index'])->name('dashboard');

        // Laboratory Reception (service request flow)
        Route::get('create', [LabSampleController::class, 'create'])->name('create');
        
        // Sample Types
        Route::resource('sample-types', LabSampleTypeController::class);
        Route::resource('areas', LabAreaController::class)
            ->except(['show'])
            ->middleware('permission:manage-lab-profiles');

        // Test Profiles
        Route::resource('test-profiles', LabTestProfileController::class)
            ->except(['show'])
            ->middleware('permission:manage-lab-profiles');
        Route::resource('equipments', LabEquipmentController::class)
            ->except(['show'])
            ->middleware('permission:manage-lab-equipment');
        // Samples
        Route::post('samples/bulk', [LabSampleController::class, 'bulkStore'])->name('samples.bulk-store');
        Route::get('samples/{sample}/collect', [LabSampleController::class, 'showCollectForm'])->name('samples.collect-form');
        Route::post('samples/{sample}/collect', [LabSampleController::class, 'collect'])->name('samples.collect');
        Route::post('samples/{sample}/receive', [LabSampleController::class, 'receive'])->name('samples.receive');
        Route::post('samples/{sample}/reject', [LabSampleController::class, 'reject'])->name('samples.reject');
        Route::get('samples/{sample}/start-analysis', [LabSampleController::class, 'showStartAnalysisForm'])
            ->middleware('permission:start-lab-analysis')
            ->name('samples.start-analysis-form');
        Route::post('samples/{sample}/start-analysis', [LabSampleController::class, 'startAnalysis'])
            ->middleware('permission:start-lab-analysis')
            ->name('samples.start-analysis');
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
        Route::post('results/batch', [LabResultController::class, 'storeBatch'])->name('results.batch');
        Route::resource('results', LabResultController::class);
        
        // Validations
        Route::resource('validations', LabValidationController::class);

        // Reports (published study PDFs)
        Route::get('reports', [LabReportController::class, 'index'])->name('reports.index');
        Route::post('samples/{sample}/report', [LabReportController::class, 'publish'])->name('reports.publish');
        Route::get('reports/{report}/download', [LabReportController::class, 'download'])->name('reports.download');
    });
