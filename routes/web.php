<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\IdCardController;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    
    // ID Card routes
    Route::resource('id-cards', IdCardController::class);
});

require __DIR__.'/settings.php';
