<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRoleRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    /** Lista usuários. Filtros: ?role=leitor|pesquisador|admin  ?q=nome ou e-mail */
    public function index(Request $request)
    {
        $users = User::withCount('articles')
            ->when($request->query('role'), fn ($q, $role) => $q->where('role', $role))
            ->when($request->query('q'), function ($q, $term) {
                $like = '%' . $term . '%';
                $q->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('email', 'like', $like));
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return UserResource::collection($users);
    }

    public function updateRole(UpdateUserRoleRequest $request, User $user)
    {
        // Evita que o admin se tranque para fora do próprio painel.
        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'Você não pode alterar o seu próprio perfil de acesso.',
            ], 422);
        }

        $user->update(['role' => $request->validated('role')]);

        return new UserResource($user->loadCount('articles'));
    }
}
