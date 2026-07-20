<?php

namespace App\Http\Controllers;

use App\Models\DepartmentTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class DepartmentTemplateController extends Controller
{
    private const DEPARTMENTS = ['admin', 'hr', 'finance', 'nurse'];

    public function index(): Response
    {
        $rows = DepartmentTemplate::whereIn('department', self::DEPARTMENTS)->get()->keyBy('department');

        // Build a keyed map; departments with no DB record are missing (frontend falls back to defaults)
        $templates = [];
        foreach (self::DEPARTMENTS as $dept) {
            if ($rows->has($dept)) {
                $templates[$dept] = $rows[$dept];
            }
        }

        return Inertia::render('id-cards/templates', [
            'templates' => $templates,
        ]);
    }

    public function update(Request $request, string $department): RedirectResponse
    {
        if (!in_array($department, self::DEPARTMENTS)) {
            abort(404);
        }

        $validated = $request->validate([
            'front_layout'   => 'required|array',
            'back_layout'    => 'required|array',
            'img_layout'     => 'required|array',
        ]);

        DepartmentTemplate::updateOrCreate(
            ['department' => $department],
            $validated
        );

        return back()->with('success', ucfirst($department) . ' template saved successfully!');
    }
}
