<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CommissionController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here are the API routes for the application. These routes return JSON
| and are used by the frontend for data operations.
|
*/

Route::middleware(['auth:sanctum'])->group(function () {
    // Professional Commissions API
    Route::get('/professional-commissions', [CommissionController::class, 'apiGetProfessionalCommissions']);
    Route::post('/professional-commissions/{professionalId}', [CommissionController::class, 'apiUpdateProfessionalCommission']);
});
