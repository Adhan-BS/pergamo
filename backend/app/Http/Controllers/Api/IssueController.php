<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\IssueResource;
use App\Models\Issue;
use Illuminate\Http\Request;

class IssueController extends Controller
{
    /**
     * Edições que já têm artigos publicados, das mais recentes para as mais antigas.
     * Usada na página inicial. Filtros: ?journal=id  ?area=slug  ?per_page=6
     */
    public function index(Request $request)
    {
        $perPage = min(max((int) $request->query('per_page', 6), 1), 50);

        $issues = Issue::with('journal.area')
            ->withCount(['articles' => fn ($q) => $q->published()])
            ->whereHas('articles', fn ($q) => $q->published())
            ->when($request->query('journal'), fn ($q, $id) => $q->where('journal_id', $id))
            ->when($request->query('area'), function ($q, $slug) {
                $q->whereHas('journal.area', fn ($a) => $a->where('slug', $slug));
            })
            ->orderByDesc('published_at')
            ->orderByDesc('year')
            ->orderByDesc('number')
            ->paginate($perPage)
            ->withQueryString();

        return IssueResource::collection($issues);
    }

    public function show(Issue $issue)
    {
        $issue->load([
            'journal.area',
            'articles' => fn ($q) => $q->published()->with(['authors', 'keywords', 'area'])->orderBy('title'),
        ]);

        return new IssueResource($issue);
    }
}
