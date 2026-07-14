<?php

namespace App\Http\Controllers;

use App\Models\IdCard;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Picqer\Barcode\BarcodeGeneratorPNG;

class IdCardController extends Controller
{
    /**
     * Show the ID cards list
     */
    public function index(Request $request): Response
    {
        $query = IdCard::with('createdBy')->orderBy('created_at', 'desc');

        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }

        $idCards = $query->paginate(15);

        return Inertia::render('id-cards/index', [
            'idCards'    => $idCards,
            'department' => $request->department ?? '',
        ]);
    }

    /**
     * Show the form for creating a new ID card
     */
    public function create(): Response
    {
        return Inertia::render('id-cards/create');
    }

    /**
     * Store a newly created ID card
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code'          => 'required|string|unique:id_cards,code',
            'first_name'    => 'required|string|max:255',
            'last_name'     => 'required|string|max:255',
            'email'         => 'required|email|max:255',
            'phone'         => 'nullable|string|max:20',
            'group'         => 'required|string|max:255',
            'department'    => 'required|in:admin,hr,finance,nurse',
            'position'      => 'nullable|string|max:255',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_phone'=> 'nullable|string|max:20',
            'address'       => 'nullable|string',
            'photo'         => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'notes'         => 'nullable|string',
        ]);

        // Handle photo upload
        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('id-cards/photos', 'public');
        }

        // Generate barcode
        $barcodeGenerator = new BarcodeGeneratorPNG();
        $barcodeContent = $barcodeGenerator->getBarcode($validated['code'], BarcodeGeneratorPNG::TYPE_CODE_128);
        
        $barcodePath = 'id-cards/barcodes/' . uniqid() . '.png';
        Storage::disk('public')->put($barcodePath, $barcodeContent);

        // Create ID card record
        IdCard::create([
            'code'           => $validated['code'],
            'first_name'     => $validated['first_name'],
            'last_name'      => $validated['last_name'],
            'email'          => $validated['email'],
            'phone'          => $validated['phone'],
            'group'          => $validated['group'],
            'department'     => $validated['department'],
            'position'       => $validated['position'] ?? null,
            'guardian_name'  => $validated['guardian_name'] ?? null,
            'guardian_phone' => $validated['guardian_phone'] ?? null,
            'address'        => $validated['address'] ?? null,
            'photo_path'     => $photoPath,
            'barcode_path'   => $barcodePath,
            'notes'          => $validated['notes'],
            'created_by'     => auth()->id(),
        ]);

        return redirect()->route('id-cards.index')
            ->with('success', 'ID Card created successfully!');
    }

    /**
     * Show a specific ID card
     */
    public function show(IdCard $idCard): Response
    {
        return Inertia::render('id-cards/show', [
            'idCard' => $idCard->load('createdBy'),
        ]);
    }

    /**
     * Show the form for editing an ID card (merged with show view)
     */
    public function edit(IdCard $idCard): Response
    {
        return Inertia::render('id-cards/show', [
            'idCard' => $idCard->load('createdBy'),
        ]);
    }

    /**
     * Update an ID card
     */
    public function update(Request $request, IdCard $idCard): RedirectResponse
    {
        $validated = $request->validate([
            'code'          => 'required|string|unique:id_cards,code,' . $idCard->id,
            'first_name'    => 'required|string|max:255',
            'last_name'     => 'required|string|max:255',
            'email'         => 'required|email|max:255',
            'phone'         => 'nullable|string|max:20',
            'group'         => 'required|string|max:255',
            'department'    => 'required|in:admin,hr,finance,nurse',
            'position'      => 'nullable|string|max:255',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_phone'=> 'nullable|string|max:20',
            'address'       => 'nullable|string',
            'photo'         => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'barcode'       => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'signature'     => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'notes'         => 'nullable|string',
        ]);

        // Handle photo upload
        if ($request->hasFile('photo')) {
            if ($idCard->photo_path) Storage::disk('public')->delete($idCard->photo_path);
            $validated['photo_path'] = $request->file('photo')->store('id-cards/photos', 'public');
        }

        // Handle manual barcode upload (takes priority over auto-generation)
        if ($request->hasFile('barcode')) {
            if ($idCard->barcode_path) Storage::disk('public')->delete($idCard->barcode_path);
            $validated['barcode_path'] = $request->file('barcode')->store('id-cards/barcodes', 'public');
        } elseif ($validated['code'] !== $idCard->code) {
            if ($idCard->barcode_path) Storage::disk('public')->delete($idCard->barcode_path);
            $barcodeGenerator = new BarcodeGeneratorPNG();
            $barcodeContent   = $barcodeGenerator->getBarcode($validated['code'], BarcodeGeneratorPNG::TYPE_CODE_128);
            $barcodePath      = 'id-cards/barcodes/' . uniqid() . '.png';
            Storage::disk('public')->put($barcodePath, $barcodeContent);
            $validated['barcode_path'] = $barcodePath;
        }

        // Handle signature upload
        if ($request->hasFile('signature')) {
            if ($idCard->signature_path) Storage::disk('public')->delete($idCard->signature_path);
            $validated['signature_path'] = $request->file('signature')->store('id-cards/signatures', 'public');
        }

        $idCard->update($validated);

        return redirect()->route('id-cards.show', $idCard)
            ->with('success', 'ID Card updated successfully!');
    }

    /**
     * Delete an ID card
     */
    public function destroy(IdCard $idCard): RedirectResponse
    {
        if ($idCard->photo_path) Storage::disk('public')->delete($idCard->photo_path);
        if ($idCard->barcode_path) Storage::disk('public')->delete($idCard->barcode_path);
        if ($idCard->signature_path) Storage::disk('public')->delete($idCard->signature_path);

        $idCard->delete();

        return redirect()->route('id-cards.index')
            ->with('success', 'ID Card deleted successfully!');
    }
}
