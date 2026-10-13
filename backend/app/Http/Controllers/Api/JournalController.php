<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\JournalResource;
use App\Models\Journal;
use Illuminate\Http\Request;

class JournalController extends Controller
{
    public function index(Request $request)
    {
        $journals = Journal::with('area')
            ->when($request->query('area'), function ($query, $slug) {
                $query->whereHas('area', fn ($a) => $a->where('slug', $slug));
            })
            ->orderBy('title')
            ->get();

        return JournalResource::collection($journals);
    }

    public function show(Journal $journal)
    {
        $journal->load([
            'area',
            'issues' => fn ($q) => $q->orderByDesc('year')->orderByDesc('number'),
        ]);

        return new JournalResource($journal);
    }
}
