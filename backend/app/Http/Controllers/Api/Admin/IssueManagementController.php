<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IssueRequest;
use App\Http\Resources\IssueResource;
use App\Models\Issue;
use Illuminate\Http\Request;

class IssueManagementController extends Controller
{
    /** Lista edições. Filtro opcional: ?journal=id */
    public function index(Request $request)
    {
        $issues = Issue::with('journal')
            ->when($request->query('journal'), fn ($q, $id) => $q->where('journal_id', $id))
            ->orderByDesc('year')
            ->orderByDesc('number')
            ->paginate(15)
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
