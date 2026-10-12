<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Journal extends Model
{
    protected $fillable = ['area_id', 'title', 'description', 'issn'];

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function issues(): HasMany
    {
        return $this->hasMany(Issue::class);
    }
}
