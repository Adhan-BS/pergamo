<?php

namespace App\Http\Requests\Article;

use App\Models\Article;
use Illuminate\Foundation\Http\FormRequest;

class StoreArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Article::class);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'abstract' => ['required', 'string', 'min:30', 'max:5000'],
            'area_id' => ['required', 'integer', 'exists:areas,id'],
            'file' => ['required', 'file', 'mimes:pdf', 'max:10240'],
            'authors' => ['required', 'array', 'min:1'],
            'authors.*.name' => ['required', 'string', 'max:255'],
            'authors.*.affiliation' => ['nullable', 'string', 'max:255'],
            'authors.*.email' => ['nullable', 'email', 'max:255'],
            'keywords' => ['nullable', 'array', 'max:10'],
            'keywords.*' => ['string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'O título é obrigatório.',
            'abstract.required' => 'O resumo é obrigatório.',
            'abstract.min' => 'O resumo deve ter pelo menos 30 caracteres.',
            'area_id.required' => 'Informe a área do artigo.',
            'area_id.exists' => 'A área informada não existe.',
            'file.required' => 'Envie o arquivo PDF do artigo.',
            'file.mimes' => 'O arquivo deve ser um PDF.',
            'file.max' => 'O PDF pode ter no máximo 10 MB.',
            'authors.required' => 'Informe pelo menos um autor.',
            'authors.*.name.required' => 'Todo autor precisa de um nome.',
        ];
    }
}
