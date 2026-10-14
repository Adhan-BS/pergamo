import { Link, useParams } from 'react-router-dom';
import { catalog } from '../api/index.js';
import { useFetch } from '../hooks/useFetch.js';
import IssueCard from '../components/IssueCard.jsx';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback.jsx';

export default function JournalDetail() {
  const { id } = useParams();
  const { data: journal, loading, error, reload } = useFetch(() => catalog.getJournal(id), [id]);

  if (loading) return <Loading />;

  if (error?.status === 404) {
    return (
      <section className="container estado">
        <h2>Revista não encontrada</h2>
        <Link to="/revistas" className="btn btn-dark">
          Ver todas as revistas
        </Link>
      </section>
    );
  }

  if (error) return <ErrorMessage error={error} onRetry={reload} />;

  return (
    <section className="container">
      <Link to="/revistas" className="voltar">
        ← Todas as revistas
      </Link>

      <header className="cabecalho-pagina">
        {journal.area && <span className="selo-area selo-escuro">{journal.area.name}</span>}
        <h1>{journal.title}</h1>
        {journal.issn && <small>ISSN {journal.issn}</small>}
        {journal.description && <p>{journal.description}</p>}
      </header>

      <div className="secao-header">
        <h2>Edições</h2>
      </div>

      {journal.issues.length === 0 ? (
        <EmptyState>Esta revista ainda não tem edições.</EmptyState>
      ) : (
        <div className="edicoes-grid">
          {journal.issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} journal={journal} />
          ))}
        </div>
      )}
    </section>
  );
}
