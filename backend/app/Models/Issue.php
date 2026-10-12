<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Issue extends Model
{
    protected $fillable = ['journal_id', 'number', 'year', 'published_at'];

    protected function casts(): array
    {
        return ['published_at' => 'date'];
    }

    public function journal(): BelongsTo
    {
        return $this->belongsTo(Journal::class);
    }

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }
}
