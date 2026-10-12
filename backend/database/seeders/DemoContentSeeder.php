<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Article;
use App\Models\Author;
use App\Models\Issue;
use App\Models\Journal;
use App\Models\Keyword;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoContentSeeder extends Seeder
{
    public function run(): void
    {
        $pesquisador = User::where('email', 'pesquisador@pergamo.test')->firstOrFail();

        $revistas = [
            ['slug' => 'exatas', 'issn' => '2674-0001', 'title' => 'Revista Amazônica de Ciências Exatas',
             'description' => 'Matemática, física, química e computação aplicadas à realidade amazônica.'],
            ['slug' => 'humanas', 'issn' => '2674-0002', 'title' => 'Revista Pérgamo de Humanidades',
             'description' => 'Pesquisas em história, sociologia, educação e comunicação.'],
            ['slug' => 'saude', 'issn' => '2674-0003', 'title' => 'Revista de Saúde e Sociedade',
             'description' => 'Saúde coletiva, epidemiologia e práticas clínicas.'],
        ];

        $edicoes = [];
        foreach ($revistas as $r) {
            $area = Area::where('slug', $r['slug'])->firstOrFail();

            $journal = Journal::updateOrCreate(
                ['issn' => $r['issn']],
                ['area_id' => $area->id, 'title' => $r['title'], 'description' => $r['description']]
            );

            $edicoes[$r['slug']] = Issue::updateOrCreate(
                ['journal_id' => $journal->id, 'year' => 2026, 'number' => 1],
                ['published_at' => '2026-09-01']
            );
        }

        $artigos = [
            [
                'area' => 'exatas',
                'title' => 'Aprendizado de máquina na previsão de cheias na bacia amazônica',
                'abstract' => 'Este estudo compara modelos de aprendizado de máquina para prever o nível dos rios na bacia amazônica a partir de séries históricas de chuva e vazão.',
                'status' => 'publicado',
                'authors' => [['Maria Silva', 'UFAM'], ['Carlos Mendes', 'UEA']],
                'keywords' => ['aprendizado de máquina', 'hidrologia', 'Amazônia'],
            ],
            [
                'area' => 'humanas',
                'title' => 'Acesso aberto e a democratização do conhecimento científico',
                'abstract' => 'A pesquisa analisa como o modelo de acesso aberto reduz barreiras financeiras à publicação e à leitura de artigos acadêmicos no Brasil.',
                'status' => 'publicado',
                'authors' => [['Ana Beatriz Lima', 'UFAM']],
                'keywords' => ['acesso aberto', 'divulgação científica', 'educação'],
            ],
            [
                'area' => 'saude',
                'title' => 'Segurança alimentar em comunidades ribeirinhas do Amazonas',
                'abstract' => 'Levantamento sobre insegurança alimentar em comunidades ribeirinhas, relacionando renda, acesso a transporte e consumo de pescado.',
                'status' => 'publicado',
                'authors' => [['Roberto Alves', 'FIOCRUZ'], ['Maria Silva', 'UFAM']],
                'keywords' => ['segurança alimentar', 'saúde coletiva', 'ribeirinhos'],
            ],
            [
                'area' => 'exatas',
                'title' => 'Estudo preliminar sobre otimização de rotas fluviais',
                'abstract' => 'Artigo ainda em avaliação que propõe heurísticas para planejar rotas de transporte fluvial de carga.',
                'status' => 'submetido',
                'authors' => [['Maria Silva', 'UFAM']],
                'keywords' => ['otimização', 'logística'],
            ],
        ];

        foreach ($artigos as $dados) {
            $area = Area::where('slug', $dados['area'])->firstOrFail();
            $publicado = $dados['status'] === 'publicado';

            $article = Article::updateOrCreate(
                ['title' => $dados['title']],
                [
                    'submitted_by' => $pesquisador->id,
                    'area_id' => $area->id,
                    'issue_id' => $publicado ? $edicoes[$dados['area']]->id : null,
                    'abstract' => $dados['abstract'],
                    'file_path' => 'articles/exemplo.pdf',
                    'status' => $dados['status'],
                    'published_at' => $publicado ? '2026-09-01 09:00:00' : null,
                ]
            );

            $autores = [];
            foreach ($dados['authors'] as $posicao => [$nome, $afiliacao]) {
                $autor = Author::firstOrCreate(['name' => $nome], ['affiliation' => $afiliacao]);
                $autores[$autor->id] = ['position' => $posicao + 1];
            }
            $article->authors()->sync($autores);

            $article->keywords()->sync(
                collect($dados['keywords'])
                    ->map(fn ($k) => Keyword::firstOrCreate(['name' => $k])->id)
                    ->all()
            );
        }
    }
}
