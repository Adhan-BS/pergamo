<?php

namespace Tests\Feature;

use App\Models\Area;
use App\Models\Issue;
use App\Models\Journal;
use App\Models\User;
use Tests\ApiTestCase;

class AdminManagementTest extends ApiTestCase
{
    // ---------- Acesso ----------

    public function test_non_admins_are_blocked_from_admin_routes(): void
    {
        $this->loginAs(self::RESEARCHER)
            ->postJson('/api/admin/areas', ['name' => 'Engenharias'])
            ->assertForbidden();

        $this->getJson('/api/admin/users')->assertForbidden();
        $this->getJson('/api/admin/issues')->assertForbidden();
    }

    public function test_admin_routes_require_authentication(): void
    {
        $this->getJson('/api/admin/users')->assertUnauthorized();
    }

    // ---------- Áreas ----------

    public function test_admin_creates_area_with_generated_slug(): void
    {
        $this->loginAs(self::ADMIN)
            ->postJson('/api/admin/areas', ['name' => 'Engenharias'])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'engenharias');
    }

    public function test_area_names_must_be_unique(): void
    {
        $this->loginAs(self::ADMIN)
            ->postJson('/api/admin/areas', ['name' => 'Exatas'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    public function test_admin_updates_area(): void
    {
        $area = Area::create(['name' => 'Temporária', 'slug' => 'temporaria']);

        $this->loginAs(self::ADMIN)
            ->putJson("/api/admin/areas/{$area->id}", ['name' => 'Engenharias e Arquitetura'])
            ->assertOk()
            ->assertJsonPath('data.slug', 'engenharias-e-arquitetura');
    }

    public function test_area_with_journals_cannot_be_deleted(): void
    {
        $area = Area::where('slug', 'exatas')->firstOrFail();

        $this->loginAs(self::ADMIN)
            ->deleteJson("/api/admin/areas/{$area->id}")
            ->assertStatus(409);

        $this->assertDatabaseHas('areas', ['id' => $area->id]);
    }

    public function test_empty_area_can_be_deleted(): void
    {
        $area = Area::create(['name' => 'Vazia', 'slug' => 'vazia']);

        $this->loginAs(self::ADMIN)
            ->deleteJson("/api/admin/areas/{$area->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('areas', ['id' => $area->id]);
    }

    // ---------- Revistas ----------

    private function journalPayload(array $override = []): array
    {
        return array_merge([
            'area_id' => Area::firstOrFail()->id,
            'title' => 'Revista de Teste',
            'description' => 'Descrição de teste',
            'issn' => '2674-0099',
        ], $override);
    }

    public function test_admin_creates_journal(): void
    {
        $this->loginAs(self::ADMIN)
            ->postJson('/api/admin/journals', $this->journalPayload())
            ->assertCreated()
            ->assertJsonPath('data.issn', '2674-0099');
    }

    public function test_journal_issn_must_have_valid_format(): void
    {
        $this->loginAs(self::ADMIN)
            ->postJson('/api/admin/journals', $this->journalPayload(['issn' => '123']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('issn');
    }

    public function test_journal_issn_must_be_unique(): void
    {
        $existing = Journal::firstOrFail()->issn;

        $this->loginAs(self::ADMIN)
            ->postJson('/api/admin/journals', $this->journalPayload(['issn' => $existing]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('issn');
    }

    public function test_admin_can_resend_the_same_issn_when_updating(): void
    {
        $journal = Journal::firstOrFail();

        $this->loginAs(self::ADMIN)
            ->putJson("/api/admin/journals/{$journal->id}", $this->journalPayload([
                'area_id' => $journal->area_id,
                'title' => 'Título novo',
                'issn' => $journal->issn,
            ]))
            ->assertOk()
            ->assertJsonPath('data.title', 'Título novo');
    }

    public function test_journal_with_articles_cannot_be_deleted(): void
    {
        $journal = Journal::firstOrFail();

        $this->loginAs(self::ADMIN)
            ->deleteJson("/api/admin/journals/{$journal->id}")
            ->assertStatus(409);
    }

    public function test_empty_journal_can_be_deleted(): void
    {
        $id = $this->loginAs(self::ADMIN)
            ->postJson('/api/admin/journals', $this->journalPayload())
            ->assertCreated()
            ->json('data.id');

        $this->deleteJson("/api/admin/journals/{$id}")->assertNoContent();
        $this->assertDatabaseMissing('journals', ['id' => $id]);
    }

    // ---------- Edições ----------

    private function issuePayload(array $override = []): array
    {
        return array_merge([
            'journal_id' => Journal::firstOrFail()->id,
            'year' => 2026,
            'number' => 5,
            'published_at' => '2026-10-13',
        ], $override);
    }

    public function test_admin_creates_issue_and_duplicates_are_rejected(): void
    {
        $this->loginAs(self::ADMIN)
            ->postJson('/api/admin/issues', $this->issuePayload())
            ->assertCreated();

        $this->postJson('/api/admin/issues', $this->issuePayload())
            ->assertStatus(422)
            ->assertJsonValidationErrors('number');
    }

    public function test_admin_lists_issues_filtered_by_journal(): void
    {
        $journal = Journal::firstOrFail();

        $this->loginAs(self::ADMIN)
            ->getJson("/api/admin/issues?journal={$journal->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_updates_issue(): void
    {
        $id = $this->loginAs(self::ADMIN)
            ->postJson('/api/admin/issues', $this->issuePayload())
            ->json('data.id');

        $this->putJson("/api/admin/issues/{$id}", $this->issuePayload(['number' => 6]))
            ->assertOk()
            ->assertJsonPath('data.number', 6);
    }

    public function test_issue_with_articles_cannot_be_deleted(): void
    {
        $issue = Issue::firstOrFail();

        $this->loginAs(self::ADMIN)
            ->deleteJson("/api/admin/issues/{$issue->id}")
            ->assertStatus(409);
    }

    public function test_empty_issue_can_be_deleted(): void
    {
        $id = $this->loginAs(self::ADMIN)
            ->postJson('/api/admin/issues', $this->issuePayload())
            ->json('data.id');

        $this->deleteJson("/api/admin/issues/{$id}")->assertNoContent();
        $this->assertDatabaseMissing('issues', ['id' => $id]);
    }

    // ---------- Usuários ----------

    public function test_admin_lists_and_filters_users(): void
    {
        $this->loginAs(self::ADMIN)
            ->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonCount(3, 'data');

        $this->getJson('/api/admin/users?role=pesquisador')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->getJson('/api/admin/users?q=leitor')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_changes_a_user_role(): void
    {
        $reader = User::where('email', self::READER)->firstOrFail();

        $this->loginAs(self::ADMIN)
            ->patchJson("/api/admin/users/{$reader->id}/role", ['role' => 'pesquisador'])
            ->assertOk()
            ->assertJsonPath('data.role', 'pesquisador');

        $this->assertSame('pesquisador', $reader->fresh()->role);
    }

    public function test_invalid_role_is_rejected(): void
    {
        $reader = User::where('email', self::READER)->firstOrFail();

        $this->loginAs(self::ADMIN)
            ->patchJson("/api/admin/users/{$reader->id}/role", ['role' => 'chefe'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('role');
    }

    public function test_admin_cannot_change_own_role(): void
    {
        $admin = User::where('email', self::ADMIN)->firstOrFail();

        $this->loginAs(self::ADMIN)
            ->patchJson("/api/admin/users/{$admin->id}/role", ['role' => 'leitor'])
            ->assertStatus(422);

        $this->assertSame('admin', $admin->fresh()->role);
    }
}
