<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Article\PublishArticleRequest;
use App\Http\Resources\ManagedArticleResource;
use App\Models\Article;
use Illuminate\Http\Request;

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
