<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('department_templates', function (Blueprint $table) {
            $table->id();
            $table->string('department')->unique(); // admin, hr, finance, nurse
            $table->json('front_layout');            // positions of front text elements
            $table->json('back_layout');             // positions of back text elements
            $table->json('img_layout');              // positions of barcode & signature
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('department_templates');
    }
};
