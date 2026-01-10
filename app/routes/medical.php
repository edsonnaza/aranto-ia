<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InsuranceTypeController;
use App\Http\Controllers\ServiceCategoryController;
use App\Http\Controllers\MedicalServiceController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\ProfessionalController;
use App\Http\Controllers\SpecialtyController;
use App\Http\Controllers\ServiceRequestController;
use App\Http\Controllers\ReceptionController;
use App\Http\Controllers\CommissionController;

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

    // Specialties Management
    Route::resource('specialties', SpecialtyController::class)->names([
        'index' => 'specialties.index',
        'create' => 'specialties.create',
        'store' => 'specialties.store',
        'show' => 'specialties.show',
        'edit' => 'specialties.edit',
        'update' => 'specialties.update',
        'destroy' => 'specialties.destroy'
    ]);
    Route::patch('specialties/{specialty}/toggle-status', [SpecialtyController::class, 'toggleStatus'])
        ->name('specialties.toggle-status');

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
    
    // Patient Insurance Management
    Route::post('patients/{patient}/insurances', [PatientController::class, 'addInsurance'])
        ->name('patients.add-insurance');
    Route::patch('patients/{patient}/insurances/{insuranceTypeId}', [PatientController::class, 'updateInsurance'])
        ->name('patients.update-insurance');
    Route::delete('patients/{patient}/insurances/{insuranceTypeId}', [PatientController::class, 'removeInsurance'])
        ->name('patients.remove-insurance');

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
    Route::get('professionals-search', [ProfessionalController::class, 'search'])
        ->name('professionals.search');
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
        
        // Reception Statistics (API endpoint for frontend hook)
        Route::get('/stats', [ReceptionController::class, 'stats'])
            ->name('stats');
        
        // New Service Request (Cart Interface)
        Route::get('/create', [ReceptionController::class, 'create'])
            ->name('create');
        
        // Get service price by insurance type
        Route::get('/service-price', [ReceptionController::class, 'getServicePrice'])
            ->name('service-price');
        
        // Get professionals for selection
        Route::get('/professionals', [ProfessionalController::class, 'apiGetProfessionals'])
            ->name('professionals');
    });

    // Commission Liquidations Management
    
    // Commission API - MUST be before resource() to avoid parameter capture
    Route::post('commission-data', [CommissionController::class, 'getCommissionData'])
        ->name('commissions.data');
    Route::get('commissions/dashboard-data', [CommissionController::class, 'getDashboardData'])
        ->name('commissions.dashboard-data');
    Route::get('commissions/top-professionals', [CommissionController::class, 'getTopProfessionalsWithCommissions'])
        ->name('commissions.top-professionals');
    Route::post('commissions/report-data', [CommissionController::class, 'reportData'])
        ->name('commissions.report-data');
    
    // Commission Resource
    Route::resource('commissions', CommissionController::class)->names([
        'index' => 'commissions.index',
        'create' => 'commissions.create',
        'store' => 'commissions.store',
        'show' => 'commissions.show',
        'edit' => 'commissions.edit',
        'update' => 'commissions.update',
        'destroy' => 'commissions.destroy'
    ]);

    // Commission Actions
    Route::patch('commissions/{commission}/approve', [CommissionController::class, 'approve'])
        ->name('commissions.approve');
    Route::patch('commissions/{commission}/pay', [CommissionController::class, 'pay'])
        ->name('commissions.pay');
    Route::patch('commissions/{commission}/revert-payment', [CommissionController::class, 'revertPayment'])
        ->name('commissions.revert-payment');
    Route::patch('commissions/{commission}/cancel', [CommissionController::class, 'cancel'])
        ->name('commissions.cancel');

    // Commission Reports
    Route::get('commissions-report', [CommissionController::class, 'report'])
        ->name('commissions.report');
    Route::get('commissions-pending', [CommissionController::class, 'pending'])
        ->name('commissions.pending');

    // Commission API
    Route::get('commissions/{commission}/transactions', [CommissionController::class, 'getTransactions'])
        ->name('commissions.transactions');
    Route::get('commissions/{commission}/details', [CommissionController::class, 'getDetails'])
        ->name('commissions.details');

    // Professional Commissions Management
    Route::get('commissions/professional-commissions', [CommissionController::class, 'getProfessionalCommissions'])
        ->name('commissions.professional-commissions');
    Route::post('commissions/professional/{professionalId}/commission-percentage', [CommissionController::class, 'updateProfessionalCommission'])
        ->name('commissions.update-professional-commission');

});