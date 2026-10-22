<?php

namespace Tests\Feature;

use App\Models\Area;
use App\Models\Article;
use App\Models\User;
use Tests\ApiTestCase;

class MyArticleShowTest extends ApiTestCase
{
    private function makeDraft(?User $owner = null): Article
    {
        $owner ??= User::where('email', self::RESEARCHER)->firstOrFail();

        return Article::create([
            'submitted_by' => $owner->id,
            'area_id' => Area::firstOrFail()->id,
            'title' => 'Rascunho para consulta',
            'abstract' => str_repeat('a', 40),
            'file_path' => 'articles/arquivo.pdf',
            'status' => 'rascunho',
        ]);
    }

    public function test_owner_can_see_own_draft(): void
    {
        $draft = $this->makeDraft();

        $this->loginAs(self::RESEARCHER)
            ->getJson("/api/my/articles/{$draft->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $draft->id)
            ->assertJsonPath('data.status', 'rascunho')
            ->assertJsonStructure(['data' => ['title', 'abstract', 'area', 'authors', 'keywords']]);
    }

    public function test_owner_can_see_own_published_article_too(): void
    {
        $published = Article::published()->firstOrFail();

        $this->loginAs(self::RESEARCHER)
            ->getJson("/api/my/articles/{$published->id}")
            ->assertOk()
            ->assertJsonPath('data.status', 'publicado');
    }

    public function test_another_researcher_cannot_see_the_article(): void
    {
        $draft = $this->makeDraft();
        $other = User::factory()->create(['role' => 'pesquisador']);

        $this->loginAsUser($other)
            ->getJson("/api/my/articles/{$draft->id}")
            ->assertForbidden();
    }

    public function test_reader_and_visitor_are_blocked(): void
    {
        $draft = $this->makeDraft();

        $this->getJson("/api/my/articles/{$draft->id}")->assertUnauthorized();

        $this->loginAs(self::READER)
            ->getJson("/api/my/articles/{$draft->id}")
            ->assertForbidden();
    }

    public function test_missing_article_returns_404(): void
    {
        $this->loginAs(self::RESEARCHER)
            ->getJson('/api/my/articles/99999')
            ->assertNotFound();
    }
}
