<?php

namespace Database\Seeders;

use App\Models\Area;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AreaSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Exatas', 'Humanas', 'Saúde', 'Tecnologia', 'Biológicas'] as $nome) {
            Area::updateOrCreate(['slug' => Str::slug($nome)], ['name' => $nome]);
        }
    }
}
