<?php

namespace App\Http\Requests\Article;

use Illuminate\Foundation\Http\FormRequest;

class ReplaceArticleFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('article'));
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Envie o arquivo PDF do artigo.',
            'file.mimes' => 'O arquivo deve ser um PDF.',
            'file.max' => 'O PDF pode ter no máximo 10 MB.',
        ];
    }
}
