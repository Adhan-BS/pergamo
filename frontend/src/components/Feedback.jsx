export function Loading({ text = 'Carregando...' }) {
  return (
    <div className="estado" role="status">
      <span className="spinner" aria-hidden="true" />
      {text}
    </div>
  );
}

export function ErrorMessage({ error, onRetry }) {
  return (
    <div className="estado estado-erro" role="alert">
      <p>{error?.message ?? 'Algo deu errado.'}</p>
      {onRetry && (
        <button type="button" className="btn btn-dark" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children }) {
  return <div className="estado estado-vazio">{children}</div>;
}
