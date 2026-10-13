<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ArticleController extends Controller
{
    /**
     * Catálogo público: só artigos publicados.
     * Filtros: ?q=texto  ?area=slug  ?journal=id  ?per_page=10
     */
    public function index(Request $request)
    {
        $perPage = min(max((int) $request->query('per_page', 10), 1), 50);

        $articles = Article::published()
            ->with(['area', 'authors', 'keywords', 'issue.journal'])
            ->when($request->query('area'), function ($query, $slug) {
                $query->whereHas('area', fn ($a) => $a->where('slug', $slug));
            })
            ->when($request->query('journal'), function ($query, $journalId) {
                $query->whereHas('issue', fn ($i) => $i->where('journal_id', $journalId));
            })
            ->when($request->query('q'), function ($query, $term) {
                $like = '%' . $term . '%';
                $query->where(function ($q) use ($like) {
                    $q->where('title', 'like', $like)
                        ->orWhere('abstract', 'like', $like)
                        ->orWhereHas('keywords', fn ($k) => $k->where('name', 'like', $like))
                        ->orWhereHas('authors', fn ($a) => $a->where('name', 'like', $like));
                });
            })
            ->orderByDesc('published_at')
            ->paginate($perPage)
            ->withQueryString();

        return ArticleResource::collection($articles);
    }

    public function show(int $id)
    {
        $article = Article::published()
            ->with(['area', 'authors', 'keywords', 'issue.journal'])
            ->findOrFail($id);

        return new ArticleResource($article);
    }

    public function download(int $id)
    {
        $article = Article::published()->findOrFail($id);

        if (! Storage::disk('local')->exists($article->file_path)) {
            return response()->json(['message' => 'Arquivo do artigo não está disponível.'], 404);
        }

        $article->increment('downloads');

        return Storage::disk('local')->download(
            $article->file_path,
            Str::slug($article->title) . '.pdf'
        );
    }
}
