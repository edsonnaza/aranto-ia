<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Commission Module
    Route::get('commissions', function () {
        return Inertia::render('commission/Index', [
            'professionals' => \App\Models\Professional::with('specialty')->get()
        ]);
    })->name('commissions.index');

    // Users Management
    Route::resource('users', UserController::class)->only(['index', 'create', 'show', 'edit']);
});

require __DIR__.'/settings.php';
require __DIR__.'/cashregister.php';
require __DIR__.'/medical.php';
