<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Issue;
use Illuminate\Support\Facades\Storage;
use Tests\ApiTestCase;

class CatalogTest extends ApiTestCase
{
    public function test_lists_areas(): void
    {
        $this->getJson('/api/areas')
            ->assertOk()
            ->assertJsonCount(5, 'data');
    }

    public function test_lists_journals_and_filters_by_area(): void
    {
        $this->getJson('/api/journals')->assertOk()->assertJsonCount(3, 'data');

        $this->getJson('/api/journals?area=exatas')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_article_list_shows_only_published(): void
    {
        $this->getJson('/api/articles')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.total', 3);
    }

    public function test_article_detail_has_authors_and_keywords(): void
    {
        $article = Article::published()->firstOrFail();

        $this->getJson("/api/articles/{$article->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $article->id)
            ->assertJsonStructure(['data' => ['title', 'abstract', 'area', 'issue', 'authors', 'keywords']]);
    }

    public function test_unpublished_article_returns_404(): void
    {
        $draft = Article::where('status', 'submetido')->firstOrFail();

        $this->getJson("/api/articles/{$draft->id}")->assertNotFound();
        $this->getJson("/api/articles/{$draft->id}/download")->assertNotFound();
    }

    public function test_search_by_title_text(): void
    {
        $this->getJson('/api/articles?q=ribeirinhas')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_search_by_author_name(): void
    {
        // Maria Silva assina dois artigos publicados no seeder.
        $this->getJson('/api/articles?q=Maria Silva')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_search_never_returns_unpublished_articles(): void
    {
        $this->getJson('/api/articles?q=rotas fluviais')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_filter_by_area(): void
    {
        $this->getJson('/api/articles?area=saude')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_per_page_is_respected(): void
    {
        $this->getJson('/api/articles?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.last_page', 2);
    }

    public function test_download_returns_file_and_counts(): void
    {
        $article = Article::published()->firstOrFail();

        $this->get("/api/articles/{$article->id}/download")->assertOk();

        $this->assertSame(1, $article->fresh()->downloads);
    }

    public function test_download_returns_404_when_file_is_missing(): void
    {
        $article = Article::published()->firstOrFail();
        Storage::disk('local')->delete($article->file_path);

        $this->getJson("/api/articles/{$article->id}/download")
            ->assertNotFound()
            ->assertJsonPath('message', 'Arquivo do artigo não está disponível.');

        $this->assertSame(0, $article->fresh()->downloads);
    }

    public function test_recent_issues_list_only_issues_with_published_articles(): void
    {
        // Edição vazia não deve aparecer na página inicial.
        Issue::create(['journal_id' => 1, 'number' => 9, 'year' => 2026]);

        $this->getJson('/api/issues')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.articles_count', 1);
    }

    public function test_issue_detail_lists_published_articles(): void
    {
        $issue = Issue::firstOrFail();

        $this->getJson("/api/issues/{$issue->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.articles');
    }
}
