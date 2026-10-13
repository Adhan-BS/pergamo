<?php

namespace App\Policies;

use App\Models\Article;
use App\Models\User;

class ArticlePolicy
{
    /** Só pesquisadores submetem artigos. */
    public function create(User $user): bool
    {
        return $user->isResearcher();
    }

    /** O dono edita enquanto o artigo não foi publicado. */
    public function update(User $user, Article $article): bool
    {
        return $this->owns($user, $article) && $article->status !== 'publicado';
    }

    /** O dono apaga o que ainda não foi publicado; o admin apaga qualquer um. */
    public function delete(User $user, Article $article): bool
    {
        return $user->isAdmin()
            || ($this->owns($user, $article) && $article->status !== 'publicado');
    }

    /** Enviar o rascunho para avaliação. */
    public function submit(User $user, Article $article): bool
    {
        return $this->owns($user, $article) && $article->status === 'rascunho';
    }

    /** Só o admin publica. */
    public function publish(User $user, Article $article): bool
    {
        return $user->isAdmin();
    }

    private function owns(User $user, Article $article): bool
    {
        return $article->submitted_by === $user->id;
    }
}
