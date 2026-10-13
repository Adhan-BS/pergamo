<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // acesso já restrito pelo middleware role:admin
    }

    public function rules(): array
    {
        return [
            'role' => ['required', Rule::in(['leitor', 'pesquisador', 'admin'])],
        ];
    }

    public function messages(): array
    {
        return [
            'role.required' => 'Informe o perfil de acesso.',
            'role.in' => 'O perfil deve ser leitor, pesquisador ou admin.',
        ];
    }
}
