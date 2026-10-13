<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // o acesso já é restrito pelo middleware role:admin
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('areas', 'name')->ignore($this->route('area')),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'O nome da área é obrigatório.',
            'name.unique' => 'Já existe uma área com esse nome.',
        ];
    }
}
