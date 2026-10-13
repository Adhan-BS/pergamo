<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AreaResource;
use App\Models\Area;

class AreaController extends Controller
{
    public function index()
    {
        $areas = Area::withCount('journals')->orderBy('name')->get();

        return AreaResource::collection($areas);
    }
}
