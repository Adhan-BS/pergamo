<?php

namespace Tests\Feature;

use App\Models\Area;
use App\Models\Article;
use App\Models\Issue;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\ApiTestCase;

class ArticleSubmissionTest extends ApiTestCase
{
    private function payload(array $override = []): array
    {
        return array_merge([
            'title' => 'Artigo de teste',
            'abstract' => 'Resumo do artigo de teste com mais de trinta caracteres.',
            'area_id' => Area::firstOrFail()->id,
            'file' => UploadedFile::fake()->create('artigo.pdf', 100, 'application/pdf'),
            'authors' => [['name' => 'Autora Teste', 'affiliation' => 'UFAM']],
            'keywords' => ['teste', 'api'],
        ], $override);
    }

    private function makeArticle(string $status, ?User $owner = null): Article
    {
        $owner ??= User::where('email', self::RESEARCHER)->firstOrFail();

        return Article::create([
            'submitted_by' => $owner->id,
            'area_id' => Area::firstOrFail()->id,
            'title' => "Artigo {$status}",
            'abstract' => str_repeat('a', 40),
            'file_path' => 'articles/arquivo.pdf',
            'status' => $status,
        ]);
    }

    // ---------- Criação ----------

    public function test_researcher_creates_article_as_draft(): void
    {
        $this->loginAs(self::RESEARCHER)
            ->postJson('/api/articles', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.status', 'rascunho')
            ->assertJsonCount(1, 'data.authors')
            ->assertJsonCount(2, 'data.keywords');

        $article = Article::where('title', 'Artigo de teste')->firstOrFail();
        Storage::disk('local')->assertExists($article->file_path);
    }

    public function test_creation_requires_a_pdf(): void
    {
        $this->loginAs(self::RESEARCHER)
            ->postJson('/api/articles', $this->payload([
                'file' => UploadedFile::fake()->create('notas.txt', 10, 'text/plain'),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');
    }

    public function test_creation_requires_at_least_one_author(): void
    {
        $this->loginAs(self::RESEARCHER)
            ->postJson('/api/articles', $this->payload(['authors' => []]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('authors');
    }

    public function test_reader_and_admin_cannot_create_articles(): void
    {
        $this->loginAs(self::READER)
            ->postJson('/api/articles', $this->payload())
            ->assertForbidden();

        $this->loginAs(self::ADMIN)
            ->postJson('/api/articles', $this->payload())
            ->assertForbidden();
    }

    public function test_creation_requires_authentication(): void
    {
        $this->postJson('/api/articles', $this->payload())->assertUnauthorized();
    }

    // ---------- Meus artigos ----------

    public function test_researcher_sees_own_articles_in_any_status(): void
    {
        // No seeder, a Maria tem 3 publicados e 1 submetido.
        $this->loginAs(self::RESEARCHER)
            ->getJson('/api/my/articles')
            ->assertOk()
            ->assertJsonCount(4, 'data');
    }

    // ---------- Edição ----------

    public function test_owner_can_update_a_draft(): void
    {
        $article = $this->makeArticle('rascunho');

        $this->loginAs(self::RESEARCHER)
            ->putJson("/api/articles/{$article->id}", ['title' => 'Novo título'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Novo título');
    }

    public function test_another_researcher_cannot_update(): void
    {
        $article = $this->makeArticle('rascunho');
        $other = User::factory()->create(['role' => 'pesquisador']);

        $this->loginAsUser($other)
            ->putJson("/api/articles/{$article->id}", ['title' => 'Invasão'])
            ->assertForbidden();
    }

    public function test_published_article_cannot_be_updated(): void
    {
        $article = $this->makeArticle('publicado');

        $this->loginAs(self::RESEARCHER)
            ->putJson("/api/articles/{$article->id}", ['title' => 'Mudança'])
            ->assertForbidden();
    }

    public function test_owner_can_replace_the_file(): void
    {
        $this->loginAs(self::RESEARCHER)
            ->postJson('/api/articles', $this->payload())
            ->assertCreated();

        $article = Article::where('title', 'Artigo de teste')->firstOrFail();
        $oldPath = $article->file_path;

        $this->postJson("/api/articles/{$article->id}/file", [
            'file' => UploadedFile::fake()->create('novo.pdf', 100, 'application/pdf'),
        ])->assertOk();

        $this->assertNotSame($oldPath, $article->fresh()->file_path);
        Storage::disk('local')->assertMissing($oldPath);
        Storage::disk('local')->assertExists($article->fresh()->file_path);
    }

    // ---------- Envio para avaliação ----------

    public function test_submit_moves_draft_to_submitted_only_once(): void
    {
        $article = $this->makeArticle('rascunho');

        $this->loginAs(self::RESEARCHER)
            ->postJson("/api/articles/{$article->id}/submit")
            ->assertOk()
            ->assertJsonPath('data.status', 'submetido');

        $this->postJson("/api/articles/{$article->id}/submit")->assertForbidden();
    }

    // ---------- Avaliação pelo admin ----------

    public function test_admin_sees_the_review_queue(): void
    {
        $this->loginAs(self::ADMIN)
            ->getJson('/api/admin/articles')
            ->assertOk()
            ->assertJsonCount(1, 'data'); // só o submetido do seeder
    }

    public function test_researcher_cannot_access_admin_routes(): void
    {
        $this->loginAs(self::RESEARCHER)->getJson('/api/admin/articles')->assertForbidden();
    }

    public function test_admin_publishes_a_submitted_article(): void
    {
        $article = $this->makeArticle('submetido');
        $issue = Issue::firstOrFail();

        $this->loginAs(self::ADMIN)
            ->patchJson("/api/admin/articles/{$article->id}/publish", ['issue_id' => $issue->id])
            ->assertOk()
            ->assertJsonPath('data.status', 'publicado');

        $this->assertNotNull($article->fresh()->published_at);
        $this->assertSame($issue->id, $article->fresh()->issue_id);
    }

    public function test_draft_cannot_be_published(): void
    {
        $article = $this->makeArticle('rascunho');

        $this->loginAs(self::ADMIN)
            ->patchJson("/api/admin/articles/{$article->id}/publish", ['issue_id' => Issue::firstOrFail()->id])
            ->assertStatus(422);
    }

    public function test_publish_requires_an_existing_issue(): void
    {
        $article = $this->makeArticle('submetido');

        $this->loginAs(self::ADMIN)
            ->patchJson("/api/admin/articles/{$article->id}/publish", ['issue_id' => 9999])
            ->assertStatus(422)
            ->assertJsonValidationErrors('issue_id');
    }

    public function test_researcher_cannot_publish(): void
    {
        $article = $this->makeArticle('submetido');

        $this->loginAs(self::RESEARCHER)
            ->patchJson("/api/admin/articles/{$article->id}/publish", ['issue_id' => Issue::firstOrFail()->id])
            ->assertForbidden();
    }

    // ---------- Exclusão ----------

    public function test_owner_deletes_a_draft_and_the_file_is_removed(): void
    {
        $this->loginAs(self::RESEARCHER)
            ->postJson('/api/articles', $this->payload())
            ->assertCreated();

        $article = Article::where('title', 'Artigo de teste')->firstOrFail();
        $path = $article->file_path;

        $this->deleteJson("/api/articles/{$article->id}")->assertNoContent();

        $this->assertDatabaseMissing('articles', ['id' => $article->id]);
        Storage::disk('local')->assertMissing($path);
    }

    public function test_owner_cannot_delete_a_published_article(): void
    {
        $article = Article::published()->firstOrFail();

        $this->loginAs(self::RESEARCHER)
            ->deleteJson("/api/articles/{$article->id}")
            ->assertForbidden();
    }

    public function test_admin_can_delete_any_article_but_shared_file_is_kept(): void
    {
        $article = Article::published()->firstOrFail();

        $this->loginAs(self::ADMIN)
            ->deleteJson("/api/articles/{$article->id}")
            ->assertNoContent();

        // Os artigos do seeder compartilham o mesmo PDF; ele não pode ser apagado.
        Storage::disk('local')->assertExists('articles/exemplo.pdf');
    }

    // ---------- Fluxo completo ----------

    public function test_full_flow_from_submission_to_public_catalog(): void
    {
        $this->loginAs(self::RESEARCHER)
            ->postJson('/api/articles', $this->payload())
            ->assertCreated();

        $article = Article::where('title', 'Artigo de teste')->firstOrFail();

        $this->postJson("/api/articles/{$article->id}/submit")->assertOk();

        $this->loginAs(self::ADMIN)
            ->patchJson("/api/admin/articles/{$article->id}/publish", ['issue_id' => Issue::firstOrFail()->id])
            ->assertOk();

        $this->getJson('/api/articles')
            ->assertOk()
            ->assertJsonCount(4, 'data');
    }
}
