<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DepartmentTemplate extends Model
{
    protected $fillable = ['department', 'front_layout', 'back_layout', 'img_layout'];

    protected $casts = [
        'front_layout' => 'array',
        'back_layout'  => 'array',
        'img_layout'   => 'array',
    ];
}
