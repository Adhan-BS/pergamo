<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $usuarios = [
            ['Administrador', 'admin@pergamo.test', 'admin', 'Pérgamo'],
            ['Maria Silva', 'pesquisador@pergamo.test', 'pesquisador', 'Universidade Federal do Amazonas'],
            ['João Leitor', 'leitor@pergamo.test', 'leitor', null],
        ];

        foreach ($usuarios as [$nome, $email, $papel, $instituicao]) {
            User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $nome,
                    'password' => 'senha1234', // o cast "hashed" do model criptografa
                    'role' => $papel,
                    'institution' => $instituicao,
                ]
            );
        }
    }
}
