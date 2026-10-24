<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Article\PublishArticleRequest;
use App\Http\Resources\ManagedArticleResource;
use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ArticleReviewController extends Controller
{
    private const RELATIONS = ['submitter', 'area', 'authors', 'keywords', 'issue.journal'];

    /** Fila de avaliação. Padrão: submetidos. Use ?status=rascunho|submetido|publicado */
    public function index(Request $request)
    {
        $status = in_array($request->query('status'), ['rascunho', 'submetido', 'publicado'], true)
            ? $request->query('status')
            : 'submetido';

        $items = Article::where('status', $status)
            ->with(self::RELATIONS)
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return ManagedArticleResource::collection($items);
    }

    /**
     * O admin lê o PDF de qualquer artigo, publicado ou não, para poder avaliá-lo.
     * Não conta como download.
     */
    public function download(Article $article)
    {
        if (! Storage::disk('local')->exists($article->file_path)) {
            return response()->json(['message' => 'Arquivo do artigo não está disponível.'], 404);
        }

        return Storage::disk('local')->download($article->file_path, Str::slug($article->title) . '.pdf');
    }

    /** submetido -> publicado, vinculando a uma edição. */
    public function publish(PublishArticleRequest $request, Article $article)
    {
        if ($article->status !== 'submetido') {
            return response()->json([
                'message' => 'Apenas artigos com status "submetido" podem ser publicados.',
            ], 422);
        }

        $article->update([
            'issue_id' => $request->validated('issue_id'),
            'status' => 'publicado',
            'published_at' => now(),
        ]);

        return new ManagedArticleResource($article->load(self::RELATIONS));
    }
}
