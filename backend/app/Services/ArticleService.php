<?php

namespace App\Services;

use App\Models\Article;
use App\Models\Author;
use App\Models\Keyword;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Regras de negócio da submissão de artigos, fora do controller.
 */
class ArticleService
{
    public function create(User $user, array $data, UploadedFile $file): Article
    {
        return DB::transaction(function () use ($user, $data, $file) {
            $article = Article::create([
                'submitted_by' => $user->id,
                'area_id' => $data['area_id'],
                'title' => $data['title'],
                'abstract' => $data['abstract'],
                'file_path' => $file->store('articles'),
                'status' => 'rascunho',
            ]);

            $this->syncAuthors($article, $data['authors']);
            $this->syncKeywords($article, $data['keywords'] ?? []);

            return $article;
        });
    }

    public function update(Article $article, array $data): Article
    {
        return DB::transaction(function () use ($article, $data) {
            $article->fill(Arr::only($data, ['title', 'abstract', 'area_id']))->save();

            if (array_key_exists('authors', $data)) {
                $this->syncAuthors($article, $data['authors']);
            }

            if (array_key_exists('keywords', $data)) {
                $this->syncKeywords($article, $data['keywords'] ?? []);
            }

            return $article;
        });
    }

    public function replaceFile(Article $article, UploadedFile $file): Article
    {
        $oldPath = $article->file_path;

        $article->update(['file_path' => $file->store('articles')]);
        $this->deleteFileIfUnused($oldPath, $article->id);

        return $article;
    }

    public function delete(Article $article): void
    {
        $path = $article->file_path;
        $id = $article->id;

        $article->delete();
        $this->deleteFileIfUnused($path, $id);
    }

    private function syncAuthors(Article $article, array $authors): void
    {
        $sync = [];

        foreach (array_values($authors) as $index => $data) {
            $author = Author::firstOrCreate(
                ['name' => trim($data['name'])],
                [
                    'affiliation' => $data['affiliation'] ?? null,
                    'email' => $data['email'] ?? null,
                ]
            );

            $sync[$author->id] = ['position' => $index + 1];
        }

        $article->authors()->sync($sync);
    }

    private function syncKeywords(Article $article, array $keywords): void
    {
        $ids = collect($keywords)
            ->map(fn ($name) => trim($name))
            ->filter()
            ->unique()
            ->map(fn ($name) => Keyword::firstOrCreate(['name' => $name])->id)
            ->all();

        $article->keywords()->sync($ids);
    }

    /** Só apaga o PDF do disco se nenhum outro artigo usa o mesmo arquivo. */
    private function deleteFileIfUnused(string $path, int $exceptArticleId): void
    {
        $inUse = Article::where('file_path', $path)
            ->where('id', '!=', $exceptArticleId)
            ->exists();

        if (! $inUse) {
            Storage::disk('local')->delete($path);
        }
    }
}
