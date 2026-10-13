<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Article\ReplaceArticleFileRequest;
use App\Http\Requests\Article\StoreArticleRequest;
use App\Http\Requests\Article\UpdateArticleRequest;
use App\Http\Resources\ManagedArticleResource;
use App\Models\Article;
use App\Services\ArticleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ResearcherArticleController extends Controller
{
    private const RELATIONS = ['area', 'authors', 'keywords', 'issue.journal'];

    public function __construct(private ArticleService $articles)
    {
    }

    /** Artigos do pesquisador logado, em qualquer status. */
    public function index(Request $request)
    {
        $items = $request->user()
            ->articles()
            ->with(self::RELATIONS)
            ->latest()
            ->paginate(10);

        return ManagedArticleResource::collection($items);
    }

    public function store(StoreArticleRequest $request)
    {
        $article = $this->articles->create(
            $request->user(),
            $request->validated(),
            $request->file('file')
        );

        return (new ManagedArticleResource($article->load(self::RELATIONS)))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateArticleRequest $request, Article $article)
    {
        $this->articles->update($article, $request->validated());

        return new ManagedArticleResource($article->load(self::RELATIONS));
    }

    public function replaceFile(ReplaceArticleFileRequest $request, Article $article)
    {
        $this->articles->replaceFile($article, $request->file('file'));

        return new ManagedArticleResource($article->load(self::RELATIONS));
    }

    /** rascunho -> submetido */
    public function submit(Article $article)
    {
        Gate::authorize('submit', $article);

        $article->update(['status' => 'submetido']);

        return new ManagedArticleResource($article->load(self::RELATIONS));
    }

    public function destroy(Article $article)
    {
        Gate::authorize('delete', $article);

        $this->articles->delete($article);

        return response()->noContent();
    }
}
