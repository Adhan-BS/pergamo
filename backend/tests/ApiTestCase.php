<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

/**
 * Base dos testes da API.
 * A cada teste: banco limpo, disco de arquivos falso e dados do seeder carregados
 * (3 usuários, 5 áreas, 3 revistas, 3 edições e 4 artigos, sendo 3 publicados).
 */
abstract class ApiTestCase extends TestCase
{
    use RefreshDatabase;

    protected const ADMIN = 'admin@pergamo.test';
    protected const RESEARCHER = 'pesquisador@pergamo.test';
    protected const READER = 'leitor@pergamo.test';

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        $this->seed();
    }

    /** Autentica as próximas requisições como um dos usuários do seeder. */
    protected function loginAs(string $email): static
    {
        return $this->loginAsUser(User::where('email', $email)->firstOrFail());
    }

    protected function loginAsUser(User $user): static
    {
        // O guard guarda o usuário em cache; limpar permite trocar de usuário no mesmo teste.
        $this->app['auth']->forgetGuards();

        return $this->withToken($user->createToken('teste')->plainTextToken);
    }
}
