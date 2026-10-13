<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IssueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'journal_id' => ['required', 'integer', 'exists:journals,id'],
            'year' => ['required', 'integer', 'between:1900,' . (now()->year + 1)],
            'number' => [
                'required', 'integer', 'min:1', 'max:65535',
                // Não pode repetir o mesmo número no mesmo ano da mesma revista.
                Rule::unique('issues')
                    ->where(fn ($q) => $q
                        ->where('journal_id', $this->input('journal_id'))
                        ->where('year', $this->input('year')))
                    ->ignore($this->route('issue')),
            ],
            'published_at' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'journal_id.required' => 'Informe a revista da edição.',
            'journal_id.exists' => 'A revista informada não existe.',
            'year.required' => 'O ano é obrigatório.',
            'year.between' => 'Informe um ano válido.',
            'number.required' => 'O número da edição é obrigatório.',
            'number.unique' => 'Essa revista já tem uma edição com esse número neste ano.',
            'published_at.date' => 'A data de publicação é inválida.',
        ];
    }
}
