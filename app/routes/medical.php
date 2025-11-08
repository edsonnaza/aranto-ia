<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InsuranceTypeController;
use App\Http\Controllers\ServiceCategoryController;
use App\Http\Controllers\MedicalServiceController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\ProfessionalController;

/*
|--------------------------------------------------------------------------
| Medical System Routes
|--------------------------------------------------------------------------
|
| Here are the routes for the medical system including insurance types,
| service categories, medical services, patients, and professionals.
| All routes require authentication.
|
*/

Route::middleware(['auth', 'verified'])->prefix('medical')->name('medical.')->group(function () {
    
    // Medical System Dashboard
    Route::get('/', function () {
        return \Inertia\Inertia::render('medical/Dashboard', [
            'stats' => [
                'total_patients' => \App\Models\Patient::count(),
                'total_professionals' => \App\Models\Professional::count(),
                'total_services' => \App\Models\MedicalService::count(),
                'total_insurance_types' => \App\Models\InsuranceType::count(),
            ],
            'recentActivity' => []
        ]);
    })->name('dashboard');
    
    // Insurance Types Management
    Route::resource('insurance-types', InsuranceTypeController::class)->names([
        'index' => 'insurance-types.index',
        'create' => 'insurance-types.create',
        'store' => 'insurance-types.store',
        'show' => 'insurance-types.show',
        'edit' => 'insurance-types.edit',
        'update' => 'insurance-types.update',
        'destroy' => 'insurance-types.destroy'
    ]);
    Route::post('insurance-types/{insuranceType}/calculate', [InsuranceTypeController::class, 'calculatePreview'])
        ->name('insurance-types.calculate');

    // Service Categories Management
    Route::resource('service-categories', ServiceCategoryController::class)->names([
        'index' => 'service-categories.index',
        'create' => 'service-categories.create',
        'store' => 'service-categories.store',
        'show' => 'service-categories.show',
        'edit' => 'service-categories.edit',
        'update' => 'service-categories.update',
        'destroy' => 'service-categories.destroy'
    ]);

    // Medical Services Management
    Route::resource('medical-services', MedicalServiceController::class)->names([
        'index' => 'medical-services.index',
        'create' => 'medical-services.create',
        'store' => 'medical-services.store',
        'show' => 'medical-services.show',
        'edit' => 'medical-services.edit',
        'update' => 'medical-services.update',
        'destroy' => 'medical-services.destroy'
    ]);
    Route::post('medical-services/{medicalService}/prices', [MedicalServiceController::class, 'storePrice'])
        ->name('medical-services.store-price');
    Route::post('medical-services/{medicalService}/calculate-commission', [MedicalServiceController::class, 'calculateCommission'])
        ->name('medical-services.calculate-commission');

    // Patients Management
    Route::resource('patients', PatientController::class)->names([
        'index' => 'patients.index',
        'create' => 'patients.create',
        'store' => 'patients.store',
        'show' => 'patients.show',
        'edit' => 'patients.edit',
        'update' => 'patients.update',
        'destroy' => 'patients.destroy'
    ]);
    Route::get('patients-search', [PatientController::class, 'search'])
        ->name('patients.search');

    // Professionals Management
    Route::resource('professionals', ProfessionalController::class)->names([
        'index' => 'professionals.index',
        'create' => 'professionals.create',
        'store' => 'professionals.store',
        'show' => 'professionals.show',
        'edit' => 'professionals.edit',
        'update' => 'professionals.update',
        'destroy' => 'professionals.destroy'
    ]);
    Route::get('professionals/{professional}/commission-report', [ProfessionalController::class, 'commissionReport'])
        ->name('professionals.commission-report');
    Route::patch('professionals/{professional}/toggle-status', [ProfessionalController::class, 'toggleStatus'])
        ->name('professionals.toggle-status');

});