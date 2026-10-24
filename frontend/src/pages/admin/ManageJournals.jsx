import { useState } from 'react';
import { admin, catalog } from '../../api/index.js';
import { useFetch } from '../../hooks/useFetch.js';
import { fieldError } from '../../utils/format.js';
import FormField from '../../components/FormField.jsx';
import { EmptyState, ErrorMessage, Loading } from '../../components/Feedback.jsx';

const EMPTY = { area_id: '', title: '', description: '', issn: '' };

export default function ManageJournals() {
  const list = useFetch(() => catalog.getJournals(), []);
  const areas = useFetch(() => catalog.getAreas(), []);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState(null);
  const [flash, setFlash] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const change = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const resetForm = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors(null);
  };

  const startEdit = (journal) => {
    setEditing(journal);
    setForm({
      area_id: journal.area ? String(journal.area.id) : '',
      title: journal.title,
      description: journal.description ?? '',
      issn: journal.issn ?? '',
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
    if (!form.area_id) local.area_id = ['Escolha a área da revista.'];
    if (!form.title.trim()) local.title = ['O título da revista é obrigatório.'];
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }

    const body = {
      area_id: Number(form.area_id),
      title: form.title.trim(),
      description: form.description.trim() || null,
      issn: form.issn.trim() || null,
    };

    setSaving(true);
    try {
      if (editing) {
        await admin.updateJournal(editing.id, body);
        setFlash('Revista atualizada.');
      } else {
        await admin.createJournal(body);
        setFlash('Revista criada.');
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

  const remove = async (journal) => {
    if (!window.confirm(`Excluir a revista “${journal.title}”? As edições vazias dela também serão removidas.`)) return;
    setFlash(null);
    setError('');
    try {
      await admin.deleteJournal(journal.id);
      if (editing?.id === journal.id) resetForm();
      setFlash('Revista excluída.');
      list.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <form className="painel-form" onSubmit={submit} noValidate>
        <h3>{editing ? `Editar revista: ${editing.title}` : 'Nova revista'}</h3>

        <FormField label="Título" name="journal-title" error={fieldError(errors, 'title')}>
          <input id="journal-title" value={form.title} onChange={change('title')} />
        </FormField>

        <div className="form-linha">
          <FormField label="Área" name="journal-area" error={fieldError(errors, 'area_id')}>
            <select id="journal-area" value={form.area_id} onChange={change('area_id')}>
              <option value="">Selecione...</option>
              {(areas.data ?? []).map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="ISSN" name="journal-issn" hint="Formato 0000-0000 (opcional)." error={fieldError(errors, 'issn')}>
            <input id="journal-issn" value={form.issn} onChange={change('issn')} />
          </FormField>
        </div>

        <FormField label="Descrição" name="journal-description" error={fieldError(errors, 'description')}>
          <textarea id="journal-description" rows="3" value={form.description} onChange={change('description')} />
        </FormField>

        <div className="form-acoes">
          <button type="submit" className="btn btn-primary btn-pequeno" disabled={saving}>
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar revista'}
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
        (list.data.length === 0 ? (
          <EmptyState>Nenhuma revista cadastrada.</EmptyState>
        ) : (
          <ul className="admin-lista">
            {list.data.map((journal) => (
              <li key={journal.id} className="admin-item">
                <div>
                  <strong>{journal.title}</strong>
                  <small>
                    {journal.area?.name}
                    {journal.issn ? ` · ISSN ${journal.issn}` : ''}
                  </small>
                </div>
                <div className="meu-artigo-acoes">
                  <button type="button" className="btn btn-ghost btn-pequeno" onClick={() => startEdit(journal)}>
                    Editar
                  </button>
                  <button type="button" className="btn btn-perigo btn-pequeno" onClick={() => remove(journal)}>
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
