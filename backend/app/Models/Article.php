<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Article extends Model
{
    protected $fillable = [
        'submitted_by', 'area_id', 'issue_id', 'title', 'abstract',
        'file_path', 'status', 'published_at', 'downloads',
    ];

    protected function casts(): array
    {
        return ['published_at' => 'datetime'];
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function issue(): BelongsTo
    {
        return $this->belongsTo(Issue::class);
    }

    public function authors(): BelongsToMany
    {
        return $this->belongsToMany(Author::class)
            ->withPivot('position')
            ->orderBy('article_author.position');
    }

    public function keywords(): BelongsToMany
    {
        return $this->belongsToMany(Keyword::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'publicado');
    }
}
