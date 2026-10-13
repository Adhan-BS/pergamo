<?php

namespace Tests\Feature;

use Tests\ApiTestCase;

class AuthTest extends ApiTestCase
{
    private function newUser(array $override = []): array
    {
        return array_merge([
            'name' => 'Novo Usuario',
            'email' => 'novo@pergamo.test',
            'password' => 'senha1234',
            'password_confirmation' => 'senha1234',
            'role' => 'pesquisador',
        ], $override);
    }

    public function test_register_creates_user_and_returns_token(): void
    {
        $this->postJson('/api/register', $this->newUser())
            ->assertCreated()
            ->assertJsonStructure(['user' => ['id', 'name', 'email', 'role'], 'token']);

        $this->assertDatabaseHas('users', ['email' => 'novo@pergamo.test', 'role' => 'pesquisador']);
    }

    public function test_register_rejects_admin_role(): void
    {
        $this->postJson('/api/register', $this->newUser(['role' => 'admin']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('role');

        $this->assertDatabaseMissing('users', ['email' => 'novo@pergamo.test']);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        $this->postJson('/api/register', $this->newUser(['email' => self::RESEARCHER]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_register_requires_password_confirmation(): void
    {
        $this->postJson('/api/register', $this->newUser(['password_confirmation' => 'outra-senha']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('password');
    }

    public function test_login_returns_token_with_valid_credentials(): void
    {
        $this->postJson('/api/login', ['email' => self::RESEARCHER, 'password' => 'senha1234'])
            ->assertOk()
            ->assertJsonStructure(['user' => ['id', 'email', 'role'], 'token']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $this->postJson('/api/login', ['email' => self::RESEARCHER, 'password' => 'senha-errada'])
            ->assertUnauthorized();
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_me_returns_authenticated_user(): void
    {
        $this->loginAs(self::RESEARCHER)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.email', self::RESEARCHER)
            ->assertJsonPath('user.role', 'pesquisador');
    }

    public function test_logout_revokes_the_token(): void
    {
        $this->loginAs(self::RESEARCHER)
            ->postJson('/api/logout')
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
