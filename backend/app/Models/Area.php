<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Area extends Model
{
    protected $fillable = ['name', 'slug'];

    public function journals(): HasMany
    {
        return $this->hasMany(Journal::class);
    }

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }
}
