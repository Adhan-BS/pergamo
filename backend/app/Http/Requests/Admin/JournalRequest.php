<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class JournalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'area_id' => ['required', 'integer', 'exists:areas,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'issn' => [
                'nullable',
                'regex:/^\d{4}-\d{3}[\dXx]$/',
                Rule::unique('journals', 'issn')->ignore($this->route('journal')),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'area_id.required' => 'Informe a área da revista.',
            'area_id.exists' => 'A área informada não existe.',
            'title.required' => 'O título da revista é obrigatório.',
            'issn.regex' => 'O ISSN deve estar no formato 0000-0000.',
            'issn.unique' => 'Já existe uma revista com esse ISSN.',
        ];
    }
}
