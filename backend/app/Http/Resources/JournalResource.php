<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JournalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'issn' => $this->issn,
            'area' => new AreaResource($this->whenLoaded('area')),
            'issues' => IssueResource::collection($this->whenLoaded('issues')),
        ];
    }
}
