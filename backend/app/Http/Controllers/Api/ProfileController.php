<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\ChangePasswordRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Laravel\Sanctum\PersonalAccessToken;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

        return response()->json(['user' => new UserResource($user)]);
    }

    public function updatePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        // O cast "hashed" do model criptografa a senha.
        $user->update(['password' => $request->validated('password')]);

        // Por segurança, encerra as outras sessões e mantém só a atual.
        $current = $user->currentAccessToken();
        $user->tokens()
            ->when(
                $current instanceof PersonalAccessToken,
                fn ($q) => $q->where('id', '!=', $current->id)
            )
            ->delete();

        return response()->json(['message' => 'Senha alterada com sucesso.']);
    }
}
