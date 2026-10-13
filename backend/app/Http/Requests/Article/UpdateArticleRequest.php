<?php

namespace App\Http\Requests\Article;

use Illuminate\Foundation\Http\FormRequest;

class UpdateArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('article'));
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'abstract' => ['sometimes', 'required', 'string', 'min:30', 'max:5000'],
            'area_id' => ['sometimes', 'required', 'integer', 'exists:areas,id'],
            'authors' => ['sometimes', 'required', 'array', 'min:1'],
            'authors.*.name' => ['required', 'string', 'max:255'],
            'authors.*.affiliation' => ['nullable', 'string', 'max:255'],
            'authors.*.email' => ['nullable', 'email', 'max:255'],
            'keywords' => ['sometimes', 'nullable', 'array', 'max:10'],
            'keywords.*' => ['string', 'max:50'],
        ];
    }
}
