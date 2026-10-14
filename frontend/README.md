# Pérgamo — Front-end

Aplicação em **React** (Vite) que consome a API Laravel do Pérgamo. O visual foi herdado do front-end original (azul `#1c3050`, dourado `#b8860b`, fontes Cinzel e Poppins).

## Requisitos

- Node.js (versão LTS)
- A API do `backend/` rodando em `http://127.0.0.1:8000` (`php artisan serve`)

## Como rodar

```powershell
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`.

Em desenvolvimento, o Vite repassa as chamadas `/api` para o Laravel (veja `vite.config.js`), então **não há problema de CORES** e nada precisa ser configurado.

Outros comandos:

```powershell
npm run build     # gera a versão de produção na pasta dist/
npm run preview   # testa a versão de produção localmente
```

## Estrutura

```
src/
├── api/          client.js (HTTP, token, erros) e index.js (funções da API)
├── components/   Header, Footer, ArticleCard, IssueCard, Pagination, ProtectedRoute...
├── context/      AuthContext (usuário logado e token)
├── hooks/        useFetch (carregamento de dados)
├── pages/        Home, Catalog, ArticleDetail, Journals, JournalDetail,
│                 IssueDetail, About, Login, Register, Account, NotFound
├── styles/       CSS global e por página
└── utils/        formatação de datas, rótulos e erros de formulário
```

## Páginas

| Rota | Página | Acesso |
|---|---|---|
| `/` | Início: áreas, edições e artigos recentes | Público |
| `/artigos` | Catálogo com busca, filtro por área e paginação | Público |
| `/artigos/:id` | Detalhe do artigo e download do PDF | Público |
| `/revistas` | Revistas, com filtro por área | Público |
| `/revistas/:id` | Detalhe da revista e suas edições | Público |
| `/edicoes/:id` | Artigos de uma edição | Público |
| `/sobre` | Sobre o projeto | Público |
| `/entrar` | Login | Público |
| `/cadastro` | Cadastro de leitor ou pesquisador | Público |
| `/conta` | Perfil e troca de senha | Logado |

## Como funciona a autenticação

1. O login devolve um token, guardado no `localStorage` (`pergamo_token`).
2. `src/api/client.js` envia o token em todas as requisições (`Authorization: Bearer ...`).
3. Ao abrir o site, o `AuthContext` valida o token em `/me`. Se a API recusar, a sessão é encerrada.
4. `ProtectedRoute` bloqueia páginas que exigem login e pode exigir perfis específicos (`roles`).

## Configuração para produção

Se a API estiver em outro endereço, crie um arquivo `.env` (veja `.env.example`):

```
VITE_API_URL=https://endereco-da-api/api
```

Nesse caso, a API precisa liberar CORS para o domínio do front-end.
