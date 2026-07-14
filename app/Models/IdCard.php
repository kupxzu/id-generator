<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IdCard extends Model
{
    protected $fillable = [
        'code',
        'first_name',
        'last_name',
        'email',
        'phone',
        'group',
        'photo_path',
        'barcode_path',
        'notes',
        'created_by',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo_path ? asset('storage/' . $this->photo_path) : null;
    }

    public function getBarcodeUrlAttribute(): ?string
    {
        return $this->barcode_path ? asset('storage/' . $this->barcode_path) : null;
    }
}
