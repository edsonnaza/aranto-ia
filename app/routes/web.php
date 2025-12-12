<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Commission Module
    Route::get('commissions', function () {
        return Inertia::render('commission/Index', [
            'professionals' => \App\Models\Professional::with('specialty')->get()
        ]);
    })->name('commissions.index');
});

require __DIR__.'/settings.php';
require __DIR__.'/cashregister.php';
require __DIR__.'/medical.php';
