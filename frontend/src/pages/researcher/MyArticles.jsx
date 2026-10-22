import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { researcher } from '../../api/index.js';
import { useFetch } from '../../hooks/useFetch.js';
import { formatDate } from '../../utils/format.js';
import Pagination from '../../components/Pagination.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { EmptyState, ErrorMessage, Loading } from '../../components/Feedback.jsx';

export default function MyArticles() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;

  const list = useFetch(() => researcher.list(page), [page]);

  const [flash, setFlash] = useState(location.state?.flash ?? null);
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const goToPage = (next) => setParams(next > 1 ? { page: String(next) } : {});

  const handleSubmit = async (article) => {
    setFlash(null);
    setActionError('');
    setBusyId(article.id);
    try {
      await researcher.submit(article.id);
      setFlash(`“${article.title}” foi enviado para avaliação.`);
      list.reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (article) => {
    if (!window.confirm(`Excluir o artigo “${article.title}”? Essa ação não pode ser desfeita.`)) return;

    setFlash(null);
    setActionError('');
    setBusyId(article.id);
    try {
      await researcher.remove(article.id);
      setFlash('Artigo excluído.');
      // Se era o único da página, volta para a anterior.
      if (list.data?.data.length === 1 && page > 1) goToPage(page - 1);
      else list.reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const items = list.data?.data ?? [];

  return (
    <section className="container">
      <div className="secao-header">
        <h2>Meus artigos</h2>
        <Link to="/meus-artigos/novo" className="btn btn-primary">
          + Novo artigo
        </Link>
      </div>

      {flash && (
        <div className="alerta alerta-sucesso" role="status">
          {flash}
        </div>
      )}
      {actionError && (
        <div className="alerta alerta-erro" role="alert">
          {actionError}
        </div>
      )}

      {list.loading && !list.data && <Loading text="Carregando seus artigos..." />}
      {list.error && <ErrorMessage error={list.error} onRetry={list.reload} />}

      {list.data &&
        (items.length === 0 ? (
          <EmptyState>
            <p>Você ainda não enviou nenhum artigo.</p>
            <Link to="/meus-artigos/novo" className="btn btn-dark">
              Enviar o primeiro artigo
            </Link>
          </EmptyState>
        ) : (
          <div className="meus-artigos">
            {items.map((article) => {
              const busy = busyId === article.id;
              const journal = article.issue?.journal;

              return (
                <article key={article.id} className="meu-artigo">
                  <div className="meu-artigo-info">
                    <StatusBadge status={article.status} />
                    <h3>{article.title}</h3>
                    <p>
                      {article.area?.name} · enviado em {formatDate(article.created_at)}
                    </p>
                    {article.status === 'publicado' && journal && (
                      <p>
                        Publicado em {journal.title}, n.º {article.issue.number}/{article.issue.year}
                      </p>
                    )}
                    {article.status === 'submetido' && <p>Aguardando avaliação do administrador.</p>}
                  </div>

                  <div className="meu-artigo-acoes">
                    {article.status === 'publicado' ? (
                      <Link to={`/artigos/${article.id}`} className="btn btn-dark btn-pequeno">
                        Ver no catálogo
                      </Link>
                    ) : (
                      <>
                        <Link to={`/meus-artigos/${article.id}/editar`} className="btn btn-ghost btn-pequeno">
                          Editar
                        </Link>
                        {article.status === 'rascunho' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-pequeno"
                            disabled={busy}
                            onClick={() => handleSubmit(article)}
                          >
                            Enviar para avaliação
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-perigo btn-pequeno"
                          disabled={busy}
                          onClick={() => handleDelete(article)}
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ))}

      <Pagination meta={list.data?.meta} onChange={goToPage} />
    </section>
  );
}
