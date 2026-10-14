import { Link } from 'react-router-dom';
import { formatDate } from '../utils/format.js';

export default function IssueCard({ issue, journal }) {
  const journalData = journal ?? issue.journal;

  return (
    <Link to={`/edicoes/${issue.id}`} className="edicao-card">
      {journalData?.area && <span className="selo-area">{journalData.area.name}</span>}
      <h3>{journalData?.title ?? 'Revista'}</h3>
      <p className="edicao-numero">
        Edição n.º {issue.number} · {issue.year}
      </p>
      {issue.published_at && <small>Publicada em {formatDate(issue.published_at)}</small>}
      {issue.articles_count !== undefined && (
        <small>
          {issue.articles_count} {issue.articles_count === 1 ? 'artigo' : 'artigos'}
        </small>
      )}
      <span className="ver-mais">Ver artigos →</span>
    </Link>
  );
}
