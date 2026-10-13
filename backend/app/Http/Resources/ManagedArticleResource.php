<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

/**
 * Igual ao ArticleResource, mas mostra também o status e quem enviou.
 * Usado nas telas do pesquisador e do administrador.
 */
class ManagedArticleResource extends ArticleResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'status' => $this->status,
            'submitted_by' => new UserResource($this->whenLoaded('submitter')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ]);
    }
}
