<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])
        ->name('notifications.read-all');
    Route::post('notifications/{notificationId}/read', [NotificationController::class, 'markAsRead'])
        ->name('notifications.read');

    // Commission Module
    Route::get('commissions', function () {
        return Inertia::render('commission/Index', [
            'professionals' => \App\Models\Professional::with('specialty')->get()
        ]);
    })->name('commissions.index');

    // Users Management (requiere permiso access-user-management)
    Route::middleware('permission:access-user-management')->group(function () {
        Route::resource('users', UserController::class);
        Route::resource('roles', RoleController::class);
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/cashregister.php';
require __DIR__.'/medical.php';
require __DIR__.'/laboratory.php';
