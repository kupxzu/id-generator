<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\IdCardController;
use App\Http\Controllers\DepartmentTemplateController;

Route::inertia('/', 'auth/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Barcode proxy — avoids CORS canvas-taint issues during JPEG export
    // Only proxies to TEC-IT's barcode endpoint; code is validated server-side
    Route::get('/barcode-image', function (\Illuminate\Http\Request $request) {
        $code = (string) $request->query('code', '');

        if ($code === '' || strlen($code) > 200) {
            abort(400, 'Invalid barcode code');
        }

        $img = \Illuminate\Support\Facades\Http::get(
            'https://services.tec-it.com/aspx/tbarcode/barcode.ashx',
            [
                'accesskey' => 'demo',
                'code'      => 'Code128',
                'data'      => $code,
                'rotation'  => '270',
                'dpi'       => '96',
                'format'    => 'png',
            ]
        );

        return response($img->body(), 200, [
            'Content-Type'  => 'image/png',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    })->name('barcode-image');

    // Department template routes (must be before resource to avoid /templates matching {id_card})
    Route::get('/id-cards/templates', [DepartmentTemplateController::class, 'index'])->name('id-cards.templates');
    Route::put('/id-cards/templates/{department}', [DepartmentTemplateController::class, 'update'])->name('id-cards.templates.update');

    // ID Card routes
    Route::resource('id-cards', IdCardController::class);
});

require __DIR__.'/settings.php';
