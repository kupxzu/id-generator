<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('id_cards', function (Blueprint $table) {
            $table->enum('department', ['admin', 'hr', 'finance', 'nurse'])->default('admin')->after('group');
            $table->string('guardian_name')->nullable()->after('position');
            $table->string('guardian_phone')->nullable()->after('guardian_name');
            $table->text('address')->nullable()->after('guardian_phone');
            $table->string('signature_path')->nullable()->after('address');
        });
    }

    public function down(): void
    {
        Schema::table('id_cards', function (Blueprint $table) {
            $table->dropColumn(['department', 'guardian_name', 'guardian_phone', 'address', 'signature_path']);
        });
    }
};
