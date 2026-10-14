import { Link, useParams } from 'react-router-dom';
import { catalog } from '../api/index.js';
import { useFetch } from '../hooks/useFetch.js';
import { formatDate } from '../utils/format.js';
import { ErrorMessage, Loading } from '../components/Feedback.jsx';

export default function ArticleDetail() {
  const { id } = useParams();
  const { data: article, loading, error, reload } = useFetch(() => catalog.getArticle(id), [id]);

  if (loading) return <Loading text="Carregando artigo..." />;

  if (error?.status === 404) {
    return (
      <section className="container estado">
        <h2>Artigo não encontrado</h2>
        <p>Ele não existe ou ainda não foi publicado.</p>
        <Link to="/artigos" className="btn btn-dark">
          Voltar ao catálogo
        </Link>
      </section>
    );
  }

  if (error) return <ErrorMessage error={error} onRetry={reload} />;

  const { issue } = article;

  return (
    <section className="container">
      <article className="artigo-detalhe">
        <Link to="/artigos" className="voltar">
          ← Voltar ao catálogo
        </Link>

        {article.area && <span className="selo-area selo-escuro">{article.area.name}</span>}
        <h1>{article.title}</h1>

        <p className="artigo-meta">
          {article.published_at && <>Publicado em {formatDate(article.published_at)}</>}
          {issue && (
            <>
              {' · '}
              <Link to={`/edicoes/${issue.id}`}>
                {issue.journal?.title}, n.º {issue.number}/{issue.year}
              </Link>
            </>
          )}
        </p>

        <ul className="autores">
          {article.authors.map((author) => (
            <li key={author.id}>
              <strong>{author.name}</strong>
              {author.affiliation && <span> — {author.affiliation}</span>}
            </li>
          ))}
        </ul>

        <h2>Resumo</h2>
        <p className="resumo">{article.abstract}</p>

        {article.keywords.length > 0 && (
          <>
            <h2>Palavras-chave</h2>
            <div className="chips">
              {article.keywords.map((keyword) => (
                <Link key={keyword.id} to={`/artigos?q=${encodeURIComponent(keyword.name)}`} className="chip">
                  {keyword.name}
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="artigo-acoes">
          <a className="btn btn-primary" href={article.download_url} target="_blank" rel="noopener noreferrer">
            ⬇ Baixar PDF
          </a>
          <span>{article.downloads} downloads</span>
        </div>
      </article>
    </section>
  );
}
