<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('submitted_by')->constrained('users')->cascadeOnDelete();
    $table->foreignId('area_id')->constrained()->restrictOnDelete();
    $table->foreignId('issue_id')->nullable()->constrained()->nullOnDelete();
    $table->string('title');
    $table->text('abstract');
    $table->string('file_path');
    $table->enum('status', ['rascunho', 'submetido', 'publicado'])->default('rascunho');
    $table->timestamp('published_at')->nullable();
    $table->unsignedInteger('downloads')->default(0);
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
