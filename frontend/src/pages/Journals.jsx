import { Link, useSearchParams } from 'react-router-dom';
import { catalog } from '../api/index.js';
import { useFetch } from '../hooks/useFetch.js';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback.jsx';

export default function Journals() {
  const [params, setParams] = useSearchParams();
  const area = params.get('area') ?? '';

  const areas = useFetch(() => catalog.getAreas(), []);
  const journals = useFetch(() => catalog.getJournals({ area }), [area]);

  const selectArea = (slug) => setParams(slug ? { area: slug } : {});

  return (
    <section className="container">
      <div className="secao-header">
        <h2>Revistas</h2>
      </div>

      <div className="chips chips-filtro">
        <button type="button" className={`chip${area === '' ? ' chip-ativo' : ''}`} onClick={() => selectArea('')}>
          Todas
        </button>
        {(areas.data ?? []).map((item) => (
          <button
            key={item.id}
            type="button"
            className={`chip${area === item.slug ? ' chip-ativo' : ''}`}
            onClick={() => selectArea(item.slug)}
          >
            {item.name}
          </button>
        ))}
      </div>

      {journals.loading && <Loading />}
      {journals.error && <ErrorMessage error={journals.error} onRetry={journals.reload} />}

      {journals.data &&
        (journals.data.length === 0 ? (
          <EmptyState>Nenhuma revista nesta área ainda.</EmptyState>
        ) : (
          <div className="revistas-grid">
            {journals.data.map((journal) => (
              <Link key={journal.id} to={`/revistas/${journal.id}`} className="revista-card">
                {journal.area && <span className="selo-area">{journal.area.name}</span>}
                <h3>{journal.title}</h3>
                {journal.issn && <small>ISSN {journal.issn}</small>}
                {journal.description && <p>{journal.description}</p>}
                <span className="ver-mais">Ver edições →</span>
              </Link>
            ))}
          </div>
        ))}
    </section>
  );
}
