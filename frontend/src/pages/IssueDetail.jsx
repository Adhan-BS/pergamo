import { Link, useParams } from 'react-router-dom';
import { catalog } from '../api/index.js';
import { useFetch } from '../hooks/useFetch.js';
import { formatDate } from '../utils/format.js';
import ArticleCard from '../components/ArticleCard.jsx';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback.jsx';

export default function IssueDetail() {
  const { id } = useParams();
  const { data: issue, loading, error, reload } = useFetch(() => catalog.getIssue(id), [id]);

  if (loading) return <Loading />;

  if (error?.status === 404) {
    return (
      <section className="container estado">
        <h2>Edição não encontrada</h2>
        <Link to="/revistas" className="btn btn-dark">
          Ver revistas
        </Link>
      </section>
    );
  }

  if (error) return <ErrorMessage error={error} onRetry={reload} />;

  const { journal } = issue;

  return (
    <section className="container">
      <Link to={journal ? `/revistas/${journal.id}` : '/revistas'} className="voltar">
        ← {journal?.title ?? 'Revistas'}
      </Link>

      <header className="cabecalho-pagina">
        {journal?.area && <span className="selo-area selo-escuro">{journal.area.name}</span>}
        <h1>
          {journal?.title} · Edição n.º {issue.number}/{issue.year}
        </h1>
        {issue.published_at && <small>Publicada em {formatDate(issue.published_at)}</small>}
      </header>

      <div className="secao-header">
        <h2>Artigos desta edição</h2>
      </div>

      {issue.articles.length === 0 ? (
        <EmptyState>Nenhum artigo publicado nesta edição ainda.</EmptyState>
      ) : (
        <div className="artigos-grid">
          {issue.articles.map((article) => (
            <ArticleCard key={article.id} article={article} journalTitle={journal?.title} />
          ))}
        </div>
      )}
    </section>
  );
}
