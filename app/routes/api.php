<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CashRegisterController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\ServiceController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Rutas protegidas con autenticación
Route::middleware(['auth:sanctum'])->group(function () {
    
    // Cash Register Routes
    Route::prefix('cash-register')->name('cash-register.')->group(function () {
        
        // Obtener sesión activa (cualquier usuario autenticado)
        Route::get('/active-session', [CashRegisterController::class, 'getActiveSession'])
            ->name('active-session');
        
        // Abrir sesión (requiere permiso específico)
        Route::post('/open', [CashRegisterController::class, 'openSession'])
            ->middleware('permission:cash_register.open')
            ->name('open');
        
        // Cerrar sesión (requiere permiso específico)
        Route::post('/close', [CashRegisterController::class, 'closeSession'])
            ->middleware('permission:cash_register.close')
            ->name('close');
        
        // Forzar cierre de sesión (solo administradores/gerentes)
        Route::post('/force-close/{sessionId}', [CashRegisterController::class, 'forceCloseSession'])
            ->middleware('permission:cash_register.force_close')
            ->name('force-close');
        
        // Historial de sesiones
        Route::get('/history', [CashRegisterController::class, 'getSessionHistory'])
            ->middleware('permission:cash_register.view')
            ->name('history');
        
        // Estadísticas de caja
        Route::get('/statistics', [CashRegisterController::class, 'getStatistics'])
            ->middleware('permission:reports.cash_register')
            ->name('statistics');
    });
    
    // Transaction Routes
    Route::prefix('transactions')->name('transactions.')->group(function () {
        
        // Procesar pago de servicio médico
        Route::post('/service-payment', [TransactionController::class, 'processServicePayment'])
            ->middleware('permission:payments.process')
            ->name('service-payment');
        
        // Procesar pago a proveedor/gasto
        Route::post('/supplier-payment', [TransactionController::class, 'processSupplierPayment'])
            ->middleware('permission:payments.process')
            ->name('supplier-payment');
        
        // Obtener transacciones de sesión actual
        Route::get('/current-session', [TransactionController::class, 'getCurrentSessionTransactions'])
            ->middleware('permission:transactions.view')
            ->name('current-session');
        
        // Obtener detalle de transacción específica
        Route::get('/{transactionId}', [TransactionController::class, 'getTransactionDetail'])
            ->middleware('permission:transactions.view')
            ->name('detail');
        
        // Anular transacción
        Route::post('/{transactionId}/void', [TransactionController::class, 'voidTransaction'])
            ->middleware('permission:transactions.void')
            ->name('void');
    });
    
    // Audit Routes
    Route::prefix('audit')->name('audit.')->group(function () {
        
        // Obtener logs de auditoría generales
        Route::get('/logs', [AuditController::class, 'getAuditLogs'])
            ->middleware('permission:audit.view')
            ->name('logs');
        
        // Historial de auditoría para sesión específica
        Route::get('/session/{sessionId}', [AuditController::class, 'getSessionAuditHistory'])
            ->middleware('permission:audit.view_sessions')
            ->name('session');
        
        // Historial de auditoría para transacción específica
        Route::get('/transaction/{transactionId}', [AuditController::class, 'getTransactionAuditHistory'])
            ->middleware('permission:audit.view_transactions')
            ->name('transaction');
        
        // Reporte de actividad por usuario
        Route::get('/user-activity', [AuditController::class, 'getUserActivityReport'])
            ->middleware('permission:reports.user_activity')
            ->name('user-activity');
        
        // Resumen de actividad del sistema
        Route::get('/system-summary', [AuditController::class, 'getSystemActivitySummary'])
            ->middleware('permission:reports.system_summary')
            ->name('system-summary');
        
        // Buscar en logs de auditoría
        Route::post('/search', [AuditController::class, 'searchAuditLogs'])
            ->middleware('permission:audit.search')
            ->name('search');
    });
    
    // Service Routes
    Route::prefix('services')->name('services.')->group(function () {
        
        // Listar servicios (disponible para todos los usuarios autenticados)
        Route::get('/', [ServiceController::class, 'index'])
            ->name('index');
        
        // Obtener detalles de servicio específico
        Route::get('/{serviceId}', [ServiceController::class, 'show'])
            ->name('show');
        
        // Crear nuevo servicio
        Route::post('/', [ServiceController::class, 'store'])
            ->middleware('permission:services.create')
            ->name('store');
        
        // Actualizar servicio existente
        Route::put('/{serviceId}', [ServiceController::class, 'update'])
            ->middleware('permission:services.edit')
            ->name('update');
        
        // Desactivar servicio
        Route::delete('/{serviceId}', [ServiceController::class, 'destroy'])
            ->middleware('permission:services.delete')
            ->name('destroy');
        
        // Reactivar servicio
        Route::post('/{serviceId}/activate', [ServiceController::class, 'activate'])
            ->middleware('permission:services.edit')
            ->name('activate');
        
        // Estadísticas de servicios
        Route::get('/reports/statistics', [ServiceController::class, 'getStatistics'])
            ->middleware('permission:reports.services')
            ->name('statistics');
    });
    
});