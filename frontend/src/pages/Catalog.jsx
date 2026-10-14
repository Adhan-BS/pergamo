import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalog } from '../api/index.js';
import { useFetch } from '../hooks/useFetch.js';
import { plural } from '../utils/format.js';
import ArticleCard from '../components/ArticleCard.jsx';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback.jsx';

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const area = params.get('area') ?? '';
  const page = Number(params.get('page')) || 1;

  const [term, setTerm] = useState(q);
  // Mantém o campo sincronizado quando a busca vem do cabeçalho.
  useEffect(() => setTerm(q), [q]);

  const areas = useFetch(() => catalog.getAreas(), []);
  const articles = useFetch(
    () => catalog.getArticles({ q, area, page, per_page: 9 }),
    [q, area, page],
  );

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setParams(next);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    update({ q: term.trim(), page: '' });
  };

  const goToPage = (nextPage) => {
    update({ page: nextPage > 1 ? String(nextPage) : '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasFilters = Boolean(q || area);
  const total = articles.data?.meta?.total ?? 0;

  return (
    <section className="container">
      <div className="secao-header">
        <h2>Artigos</h2>
      </div>

      <form className="filtros" onSubmit={handleSubmit}>
        <input
          type="search"
          placeholder="Título, resumo, autor ou palavra-chave"
          aria-label="Buscar artigos"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />
        <select
          aria-label="Filtrar por área"
          value={area}
          onChange={(event) => update({ area: event.target.value, page: '' })}
        >
          <option value="">Todas as áreas</option>
          {(areas.data ?? []).map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Buscar
        </button>
        {hasFilters && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setTerm('');
              setParams(new URLSearchParams());
            }}
          >
            Limpar filtros
          </button>
        )}
      </form>

      {articles.loading && <Loading text="Buscando artigos..." />}
      {articles.error && <ErrorMessage error={articles.error} onRetry={articles.reload} />}

      {articles.data && (
        <>
          <p className="resultado-contagem">
            {total === 0 ? 'Nenhum artigo encontrado' : `${plural(total, 'artigo encontrado', 'artigos encontrados')}`}
            {q && (
              <>
                {' '}
                para <strong>“{q}”</strong>
              </>
            )}
          </p>

          {articles.data.data.length === 0 ? (
            <EmptyState>Tente outros termos de busca ou remova os filtros.</EmptyState>
          ) : (
            <div className="artigos-grid">
              {articles.data.data.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}

          <Pagination meta={articles.data.meta} onChange={goToPage} />
        </>
      )}
    </section>
  );
}
