<?php

namespace App\Http\Requests\Article;

use Illuminate\Foundation\Http\FormRequest;

class PublishArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('publish', $this->route('article'));
    }

    public function rules(): array
    {
        return [
            'issue_id' => ['required', 'integer', 'exists:issues,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'issue_id.required' => 'Informe a edição em que o artigo será publicado.',
            'issue_id.exists' => 'A edição informada não existe.',
        ];
    }
}
