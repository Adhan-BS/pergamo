<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AreaRequest;
use App\Http\Resources\AreaResource;
use App\Models\Area;
use Illuminate\Support\Str;

class AreaManagementController extends Controller
{
    public function store(AreaRequest $request)
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['name']);

        return (new AreaResource(Area::create($data)))
            ->response()
            ->setStatusCode(201);
    }

    public function update(AreaRequest $request, Area $area)
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['name']);

        $area->update($data);

        return new AreaResource($area);
    }

    public function destroy(Area $area)
    {
        if ($area->journals()->exists() || $area->articles()->exists()) {
            return response()->json([
                'message' => 'Não é possível excluir uma área que possui revistas ou artigos.',
            ], 409);
        }

        $area->delete();

        return response()->noContent();
    }
}
