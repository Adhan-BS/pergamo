export default function Pagination({ meta, onChange }) {
  if (!meta || meta.last_page <= 1) return null;

  const { current_page: current, last_page: last } = meta;

  // Mostra até 5 páginas ao redor da atual.
  const start = Math.max(1, Math.min(current - 2, last - 4));
  const end = Math.min(last, start + 4);
  const pages = [];
  for (let page = start; page <= end; page += 1) pages.push(page);

  return (
    <nav className="paginacao" aria-label="Paginação">
      <button type="button" disabled={current === 1} onClick={() => onChange(current - 1)}>
        ← Anterior
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          className={page === current ? 'atual' : ''}
          aria-current={page === current ? 'page' : undefined}
          onClick={() => onChange(page)}
        >
          {page}
        </button>
      ))}

      <button type="button" disabled={current === last} onClick={() => onChange(current + 1)}>
        Próxima →
      </button>
    </nav>
  );
}
