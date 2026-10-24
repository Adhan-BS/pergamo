import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { admin, catalog } from '../../api/index.js';
import { useFetch } from '../../hooks/useFetch.js';
import { fieldError, formatDate } from '../../utils/format.js';
import FormField from '../../components/FormField.jsx';
import Pagination from '../../components/Pagination.jsx';
import { EmptyState, ErrorMessage, Loading } from '../../components/Feedback.jsx';

const emptyForm = () => ({ journal_id: '', year: String(new Date().getFullYear()), number: '', published_at: '' });

export default function ManageIssues() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;

  const list = useFetch(() => admin.listIssues({ page }), [page]);
  const journals = useFetch(() => catalog.getJournals(), []);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState(null);
  const [flash, setFlash] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const change = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  const goToPage = (next) => setParams(next > 1 ? { page: String(next) } : {});

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm());
    setErrors(null);
  };

  const startEdit = (issue) => {
    setEditing(issue);
    setForm({
      journal_id: issue.journal ? String(issue.journal.id) : '',
      year: String(issue.year),
      number: String(issue.number),
      published_at: issue.published_at ?? '',
    });
    setErrors(null);
    setFlash(null);
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setFlash(null);
    setError('');

    const local = {};
    if (!form.journal_id) local.journal_id = ['Escolha a revista da edição.'];
    if (!form.year) local.year = ['O ano é obrigatório.'];
    if (!form.number) local.number = ['O número da edição é obrigatório.'];
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }

    const body = {
      journal_id: Number(form.journal_id),
      year: Number(form.year),
      number: Number(form.number),
      published_at: form.published_at || null,
    };

    setSaving(true);
    try {
      if (editing) {
        await admin.updateIssue(editing.id, body);
        setFlash('Edição atualizada.');
      } else {
        await admin.createIssue(body);
        setFlash('Edição criada.');
      }
      resetForm();
      list.reload();
    } catch (err) {
      setErrors(err.errors);
      if (!err.errors) setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (issue) => {
    const label = `${issue.journal?.title ?? 'Revista'}, n.º ${issue.number}/${issue.year}`;
    if (!window.confirm(`Excluir a edição “${label}”?`)) return;
    setFlash(null);
    setError('');
    try {
      await admin.deleteIssue(issue.id);
      if (editing?.id === issue.id) resetForm();
      setFlash('Edição excluída.');
      if (list.data?.data.length === 1 && page > 1) goToPage(page - 1);
      else list.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const items = list.data?.data ?? [];

  return (
    <div>
      <form className="painel-form" onSubmit={submit} noValidate>
        <h3>{editing ? 'Editar edição' : 'Nova edição'}</h3>

        <FormField label="Revista" name="issue-journal" error={fieldError(errors, 'journal_id')}>
          <select id="issue-journal" value={form.journal_id} onChange={change('journal_id')}>
            <option value="">Selecione...</option>
            {(journals.data ?? []).map((journal) => (
              <option key={journal.id} value={journal.id}>
                {journal.title}
              </option>
            ))}
          </select>
        </FormField>

        <div className="form-linha form-linha-3">
          <FormField label="Ano" name="issue-year" error={fieldError(errors, 'year')}>
            <input id="issue-year" type="number" value={form.year} onChange={change('year')} />
          </FormField>
          <FormField label="Número" name="issue-number" error={fieldError(errors, 'number')}>
            <input id="issue-number" type="number" min="1" value={form.number} onChange={change('number')} />
          </FormField>
          <FormField label="Data de publicação" name="issue-date" error={fieldError(errors, 'published_at')}>
            <input id="issue-date" type="date" value={form.published_at} onChange={change('published_at')} />
          </FormField>
        </div>

        <div className="form-acoes">
          <button type="submit" className="btn btn-primary btn-pequeno" disabled={saving}>
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar edição'}
          </button>
          {editing && (
            <button type="button" className="btn btn-ghost btn-pequeno" onClick={resetForm}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>

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

      {list.loading && !list.data && <Loading />}
      {list.error && <ErrorMessage error={list.error} onRetry={list.reload} />}

      {list.data &&
        (items.length === 0 ? (
          <EmptyState>Nenhuma edição cadastrada.</EmptyState>
        ) : (
          <ul className="admin-lista">
            {items.map((issue) => (
              <li key={issue.id} className="admin-item">
                <div>
                  <strong>
                    {issue.journal?.title} · n.º {issue.number}/{issue.year}
                  </strong>
                  <small>
                    {issue.published_at ? `Publicada em ${formatDate(issue.published_at)}` : 'Sem data de publicação'}
                  </small>
                </div>
                <div className="meu-artigo-acoes">
                  <button type="button" className="btn btn-ghost btn-pequeno" onClick={() => startEdit(issue)}>
                    Editar
                  </button>
                  <button type="button" className="btn btn-perigo btn-pequeno" onClick={() => remove(issue)}>
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}

      <Pagination meta={list.data?.meta} onChange={goToPage} />
    </div>
  );
}
