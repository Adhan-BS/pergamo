<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IssueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'year' => $this->year,
            'published_at' => $this->published_at?->toDateString(),
            'articles_count' => $this->whenCounted('articles'),
            'journal' => new JournalResource($this->whenLoaded('journal')),
            'articles' => ArticleResource::collection($this->whenLoaded('articles')),
        ];
    }
}
