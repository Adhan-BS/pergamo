<?php

namespace Tests\Feature;

use App\Models\Article;
use Illuminate\Support\Facades\Storage;
use Tests\ApiTestCase;

class AdminReviewExtrasTest extends ApiTestCase
{
    public function test_admin_reads_the_pdf_of_a_submitted_article_without_counting_a_download(): void
    {
        $article = Article::where('status', 'submetido')->firstOrFail();

        $this->loginAs(self::ADMIN)
            ->get("/api/admin/articles/{$article->id}/download")
            ->assertOk();

        $this->assertSame(0, $article->fresh()->downloads);
    }

    public function test_download_returns_404_when_the_file_is_missing(): void
    {
        $article = Article::where('status', 'submetido')->firstOrFail();
        Storage::disk('local')->delete($article->file_path);

        $this->loginAs(self::ADMIN)
            ->getJson("/api/admin/articles/{$article->id}/download")
            ->assertNotFound()
            ->assertJsonPath('message', 'Arquivo do artigo não está disponível.');
    }

    public function test_only_the_admin_can_use_the_admin_download(): void
    {
        $article = Article::where('status', 'submetido')->firstOrFail();

        $this->getJson("/api/admin/articles/{$article->id}/download")->assertUnauthorized();

        $this->loginAs(self::RESEARCHER)
            ->getJson("/api/admin/articles/{$article->id}/download")
            ->assertForbidden();
    }

    public function test_issue_list_accepts_per_page_with_a_limit(): void
    {
        $this->loginAs(self::ADMIN)
            ->getJson('/api/admin/issues?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.per_page', 2);

        $this->getJson('/api/admin/issues?per_page=1000')
            ->assertOk()
            ->assertJsonPath('meta.per_page', 100);
    }

    public function test_issue_list_includes_the_area_of_each_journal(): void
    {
        $this->loginAs(self::ADMIN)
            ->getJson('/api/admin/issues')
            ->assertOk()
            ->assertJsonStructure(['data' => ['*' => ['id', 'journal' => ['title', 'area' => ['id', 'name']]]]]);
    }
}
