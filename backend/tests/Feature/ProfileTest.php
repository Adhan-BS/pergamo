<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\ApiTestCase;

class ProfileTest extends ApiTestCase
{
    private function researcher(): User
    {
        return User::where('email', self::RESEARCHER)->firstOrFail();
    }

    public function test_profile_update_requires_authentication(): void
    {
        $this->putJson('/api/me', ['name' => 'Alguém'])->assertUnauthorized();
    }

    public function test_user_updates_own_profile(): void
    {
        $this->loginAs(self::RESEARCHER)
            ->putJson('/api/me', ['name' => 'Maria Silva Santos', 'institution' => 'UFAM'])
            ->assertOk()
            ->assertJsonPath('user.name', 'Maria Silva Santos');

        $this->assertDatabaseHas('users', ['email' => self::RESEARCHER, 'name' => 'Maria Silva Santos']);
    }

    public function test_user_cannot_change_own_role(): void
    {
        $this->loginAs(self::RESEARCHER)
            ->putJson('/api/me', ['role' => 'admin'])
            ->assertOk();

        $this->assertSame('pesquisador', $this->researcher()->role);
    }

    public function test_email_must_be_unique(): void
    {
        $this->loginAs(self::RESEARCHER)
            ->putJson('/api/me', ['email' => self::ADMIN])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_user_can_keep_own_email(): void
    {
        $this->loginAs(self::RESEARCHER)
            ->putJson('/api/me', ['email' => self::RESEARCHER, 'name' => 'Mesma Pessoa'])
            ->assertOk();
    }

    public function test_password_change_requires_correct_current_password(): void
    {
        $this->loginAs(self::RESEARCHER)
            ->putJson('/api/me/password', [
                'current_password' => 'errada123',
                'password' => 'novasenha123',
                'password_confirmation' => 'novasenha123',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('current_password');
    }

    public function test_new_password_must_differ_from_current(): void
    {
        $this->loginAs(self::RESEARCHER)
            ->putJson('/api/me/password', [
                'current_password' => 'senha1234',
                'password' => 'senha1234',
                'password_confirmation' => 'senha1234',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('password');
    }

    public function test_password_change_works_and_ends_other_sessions(): void
    {
        $user = $this->researcher();
        $user->createToken('outro-dispositivo');

        $this->loginAsUser($user)
            ->putJson('/api/me/password', [
                'current_password' => 'senha1234',
                'password' => 'novasenha123',
                'password_confirmation' => 'novasenha123',
            ])
            ->assertOk();

        $this->assertTrue(Hash::check('novasenha123', $user->fresh()->password));

        // Só o token usado na troca de senha sobrevive.
        $this->assertSame(1, $user->tokens()->count());
    }
}
