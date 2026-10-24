import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { admin } from '../../api/index.js';
import { useFetch } from '../../hooks/useFetch.js';
import { formatDate } from '../../utils/format.js';
import Pagination from '../../components/Pagination.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { EmptyState, ErrorMessage, Loading } from '../../components/Feedback.jsx';

const STATUSES = [
  ['submetido', 'Em avaliação'],
  ['rascunho', 'Rascunhos'],
  ['publicado', 'Publicados'],
];

const EMPTY_TEXT = {
  submetido: 'Nenhum artigo aguardando avaliação.',
  rascunho: 'Nenhum rascunho no sistema.',
  publicado: 'Nenhum artigo publicado ainda.',
};

export default function ReviewQueue() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('status');
  const status = STATUSES.some(([value]) => value === requested) ? requested : 'submetido';
  const page = Number(params.get('page')) || 1;

  const queue = useFetch(() => admin.reviewQueue({ status, page }), [status, page]);
  const issues = useFetch(() => admin.listIssues({ per_page: 100 }).then((r) => r.data), []);

  const [flash, setFlash] = useState(null);
  const [error, setError] = useState('');

  const goTo = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    setParams(next);
  };

  const afterChange = (message) => {
    setError('');
    setFlash(message);
    // Se era o único da página, volta para a anterior.
    if (queue.data?.data.length === 1 && page > 1) goTo({ page: String(page - 1) });
    else queue.reload();
  };

  const items = queue.data?.data ?? [];

  return (
    <div>
      <div className="chips chips-filtro" role="tablist" aria-label="Status dos artigos">
        {STATUSES.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={status === value}
            className={`chip${status === value ? ' chip-ativo' : ''}`}
            onClick={() => {
              setFlash(null);
              setError('');
              goTo({ status: value === 'submetido' ? '' : value, page: '' });
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {flash && (
        <div className="alerta alerta-sucesso" role="status">
          {flash}
        </div>
      )}
      {error && (
        <div className="alerta alerta-erro" role="alert">
          {error}
        </div>
      )}

      {queue.loading && !queue.data && <Loading text="Carregando artigos..." />}
      {queue.error && <ErrorMessage error={queue.error} onRetry={queue.reload} />}

      {queue.data &&
        (items.length === 0 ? (
          <EmptyState>{EMPTY_TEXT[status]}</EmptyState>
        ) : (
          <div className="meus-artigos">
            {items.map((article) => (
              <QueueItem
                key={article.id}
                article={article}
                issues={issues.data ?? []}
                issuesFailed={Boolean(issues.error)}
                onPublished={() => afterChange(`“${article.title}” foi publicado.`)}
                onDeleted={() => afterChange('Artigo excluído.')}
                onError={(message) => {
                  setFlash(null);
                  setError(message);
                }}
              />
            ))}
          </div>
        ))}

      <Pagination meta={queue.data?.meta} onChange={(next) => goTo({ page: next > 1 ? String(next) : '' })} />
    </div>
  );
}

function QueueItem({ article, issues, issuesFailed, onPublished, onDeleted, onError }) {
  const [expanded, setExpanded] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [issueId, setIssueId] = useState('');
  const [publishError, setPublishError] = useState('');
  const [busy, setBusy] = useState(false);

  // Edições agrupadas por revista; as revistas da mesma área do artigo vêm primeiro.
  const groups = useMemo(() => {
    const byJournal = new Map();
    issues.forEach((issue) => {
      const journal = issue.journal;
      if (!journal) return;
      if (!byJournal.has(journal.id)) byJournal.set(journal.id, { journal, issues: [] });
      byJournal.get(journal.id).issues.push(issue);
    });
    const sameArea = (group) => Number(group.journal.area?.id === article.area?.id);
    return [...byJournal.values()].sort((a, b) => sameArea(b) - sameArea(a));
  }, [issues, article.area?.id]);

  const readPdf = async () => {
    // A janela é aberta no clique, antes da requisição, para o navegador não bloquear o pop-up.
    const win = window.open('', '_blank');
    try {
      const blob = await admin.readPdf(article.id);
      const url = URL.createObjectURL(blob);
      if (win) {
        win.location.href = url;
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = `artigo-${article.id}.pdf`;
        link.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      win?.close();
      onError(err.message);
    }
  };

  const publish = async () => {
    if (!issueId) {
      setPublishError('Escolha a edição em que o artigo será publicado.');
      return;
    }
    setPublishError('');
    setBusy(true);
    try {
      await admin.publish(article.id, Number(issueId));
      onPublished();
    } catch (err) {
      setPublishError(err.errors?.issue_id?.[0] ?? err.message);
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Excluir o artigo “${article.title}”? Essa ação não pode ser desfeita.`)) return;
    setBusy(true);
    try {
      await admin.deleteArticle(article.id);
      onDeleted();
    } catch (err) {
      onError(err.message);
      setBusy(false);
    }
  };

  const submitter = article.submitted_by;
  const authors = article.authors?.map((author) => author.name).join(', ');

  return (
    <article className="meu-artigo item-fila">
      <div className="item-fila-topo">
        <div className="meu-artigo-info">
          <StatusBadge status={article.status} />
          <h3>{article.title}</h3>
          <p>
            {article.area?.name} · enviado em {formatDate(article.created_at)}
          </p>
          {submitter && (
            <p>
              Enviado por {submitter.name} ({submitter.email})
              {submitter.institution ? ` · ${submitter.institution}` : ''}
            </p>
          )}
          {authors && <p>Autores: {authors}</p>}
          {article.status === 'publicado' && article.issue?.journal && (
            <p>
              Publicado em {article.issue.journal.title}, n.º {article.issue.number}/{article.issue.year}
            </p>
          )}
        </div>

        <div className="meu-artigo-acoes">
          <button type="button" className="btn btn-ghost btn-pequeno" onClick={() => setExpanded((open) => !open)}>
            {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
          </button>
          <button type="button" className="btn btn-dark btn-pequeno" onClick={readPdf}>
            Ler PDF
          </button>
          {article.status === 'submetido' && (
            <button
              type="button"
              className="btn btn-primary btn-pequeno"
              disabled={busy}
              onClick={() => setPublishing((open) => !open)}
            >
              Publicar…
            </button>
          )}
          {article.status === 'publicado' && (
            <Link to={`/artigos/${article.id}`} className="btn btn-ghost btn-pequeno">
              Ver no catálogo
            </Link>
          )}
          <button type="button" className="btn btn-perigo btn-pequeno" disabled={busy} onClick={remove}>
            Excluir
          </button>
        </div>
      </div>

      {expanded && (
        <div className="detalhes">
          <h4>Resumo</h4>
          <p>{article.abstract}</p>
          {article.keywords?.length > 0 && (
            <>
              <h4>Palavras-chave</h4>
              <div className="chips">
                {article.keywords.map((keyword) => (
                  <span key={keyword.id} className="chip">
                    {keyword.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {publishing && article.status === 'submetido' && (
        <div className="painel-publicar">
          <label htmlFor={`issue-${article.id}`}>Publicar na edição</label>
          <select id={`issue-${article.id}`} value={issueId} onChange={(event) => setIssueId(event.target.value)}>
            <option value="">Selecione a edição...</option>
            {groups.map(({ journal, issues: list }) => (
              <optgroup
                key={journal.id}
                label={journal.area?.id === article.area?.id ? `${journal.title} (mesma área)` : journal.title}
              >
                {list.map((issue) => (
                  <option key={issue.id} value={issue.id}>
                    Edição n.º {issue.number}/{issue.year}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {issuesFailed && <small className="erro">Não foi possível carregar as edições.</small>}
          {!issuesFailed && groups.length === 0 && (
            <small className="dica">Nenhuma edição cadastrada. Crie uma na aba Edições.</small>
          )}
          {publishError && (
            <small className="erro" role="alert">
              {publishError}
            </small>
          )}
          <div className="form-acoes">
            <button type="button" className="btn btn-primary btn-pequeno" disabled={busy} onClick={publish}>
              {busy ? 'Publicando...' : 'Confirmar publicação'}
            </button>
            <button type="button" className="btn btn-ghost btn-pequeno" onClick={() => setPublishing(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
