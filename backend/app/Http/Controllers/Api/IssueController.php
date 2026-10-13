<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\IssueResource;
use App\Models\Issue;

class IssueController extends Controller
{
    public function show(Issue $issue)
    {
        $issue->load([
            'journal.area',
            'articles' => fn ($q) => $q->published()->with(['authors', 'keywords', 'area'])->orderBy('title'),
        ]);

        return new IssueResource($issue);
    }
}
