const LABELS = {
  rascunho: 'Rascunho',
  submetido: 'Em avaliação',
  publicado: 'Publicado',
};

export default function StatusBadge({ status }) {
  return <span className={`status status-${status}`}>{LABELS[status] ?? status}</span>;
}
