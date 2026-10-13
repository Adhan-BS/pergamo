<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\JournalRequest;
use App\Http\Resources\JournalResource;
use App\Models\Article;
use App\Models\Journal;

class JournalManagementController extends Controller
{
    public function store(JournalRequest $request)
    {
        $journal = Journal::create($request->validated());

        return (new JournalResource($journal->load('area')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(JournalRequest $request, Journal $journal)
    {
        $journal->update($request->validated());

        return new JournalResource($journal->load('area'));
    }

    public function destroy(Journal $journal)
    {
        $hasArticles = Article::whereHas(
            'issue',
            fn ($q) => $q->where('journal_id', $journal->id)
        )->exists();

        if ($hasArticles) {
            return response()->json([
                'message' => 'Não é possível excluir uma revista que possui artigos em suas edições.',
            ], 409);
        }

        // As edições vazias são removidas junto (cascade na migration).
        $journal->delete();

        return response()->noContent();
    }
}
