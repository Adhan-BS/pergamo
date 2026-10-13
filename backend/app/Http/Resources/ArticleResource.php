<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'abstract' => $this->abstract,
            'published_at' => $this->published_at?->toIso8601String(),
            'downloads' => $this->downloads,
            'download_url' => url("/api/articles/{$this->id}/download"),
            'area' => new AreaResource($this->whenLoaded('area')),
            'issue' => new IssueResource($this->whenLoaded('issue')),
            'authors' => AuthorResource::collection($this->whenLoaded('authors')),
            'keywords' => KeywordResource::collection($this->whenLoaded('keywords')),
        ];
    }
}
