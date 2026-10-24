<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IssueRequest;
use App\Http\Resources\IssueResource;
use App\Models\Issue;
use Illuminate\Http\Request;

class IssueManagementController extends Controller
{
    /** Lista edições. Filtros opcionais: ?journal=id  ?per_page=15 (máximo 100) */
    public function index(Request $request)
    {
        $perPage = min(max((int) $request->query('per_page', 15), 1), 100);

        $issues = Issue::with('journal.area')
            ->when($request->query('journal'), fn ($q, $id) => $q->where('journal_id', $id))
            ->orderByDesc('year')
            ->orderByDesc('number')
            ->paginate($perPage)
            ->withQueryString();

        return IssueResource::collection($issues);
    }

    public function store(IssueRequest $request)
    {
        $issue = Issue::create($request->validated());

        return (new IssueResource($issue->load('journal')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(IssueRequest $request, Issue $issue)
    {
        $issue->update($request->validated());

        return new IssueResource($issue->load('journal'));
    }

    public function destroy(Issue $issue)
    {
        if ($issue->articles()->exists()) {
            return response()->json([
                'message' => 'Não é possível excluir uma edição que possui artigos.',
            ], 409);
        }

        $issue->delete();

        return response()->noContent();
    }
}
