<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InsuranceTypeController;
use App\Http\Controllers\ServiceCategoryController;
use App\Http\Controllers\MedicalServiceController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\ProfessionalController;
use App\Http\Controllers\ServiceRequestController;
use App\Http\Controllers\ReceptionController;

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
    Route::get('medical-services-search', [MedicalServiceController::class, 'search'])
        ->name('medical-services.search');
    Route::post('medical-services-generate-code', [MedicalServiceController::class, 'generateCodePreview'])
        ->name('medical-services.generate-code');

    // Patients Management
    Route::resource('patients', PatientController::class)->names([
        'index' => 'medical.patients.index',
        'create' => 'medical.patients.create',
        'store' => 'medical.patients.store',
        'show' => 'medical.patients.show',
        'edit' => 'medical.patients.edit',
        'update' => 'medical.patients.update',
        'destroy' => 'medical.patients.destroy'
    ]);
    Route::get('patients-search', [PatientController::class, 'search'])
        ->name('medical.patients.search');
    
    // Patient Insurance Management
    Route::post('patients/{patient}/insurances', [PatientController::class, 'addInsurance'])
        ->name('medical.patients.add-insurance');
    Route::patch('patients/{patient}/insurances/{insuranceTypeId}', [PatientController::class, 'updateInsurance'])
        ->name('medical.patients.update-insurance');
    Route::delete('patients/{patient}/insurances/{insuranceTypeId}', [PatientController::class, 'removeInsurance'])
        ->name('medical.patients.remove-insurance');

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

    // Service Requests Management
    Route::resource('service-requests', ServiceRequestController::class)->names([
        'index' => 'service-requests.index',
        'create' => 'service-requests.create',
        'store' => 'service-requests.store',
        'show' => 'service-requests.show',
        'edit' => 'service-requests.edit',
        'update' => 'service-requests.update',
        'destroy' => 'service-requests.destroy'
    ]);
    
    // Service Request Actions
    Route::patch('service-requests/{serviceRequest}/confirm', [ServiceRequestController::class, 'confirm'])
        ->name('service-requests.confirm');
    Route::patch('service-requests/{serviceRequest}/cancel', [ServiceRequestController::class, 'cancel'])
        ->name('service-requests.cancel');

    // Reception Module
    Route::prefix('reception')->name('reception.')->group(function () {
        // Reception Dashboard
        Route::get('/', [ReceptionController::class, 'index'])
            ->name('index');
        
        // New Service Request (Cart Interface)
        Route::get('/create', [ReceptionController::class, 'create'])
            ->name('create');
        
        // Get service price by insurance type
        Route::get('/service-price', [ReceptionController::class, 'getServicePrice'])
            ->name('service-price');
    });

});