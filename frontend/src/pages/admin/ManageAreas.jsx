import { useState } from 'react';
import { admin, catalog } from '../../api/index.js';
import { useFetch } from '../../hooks/useFetch.js';
import { fieldError, plural } from '../../utils/format.js';
import FormField from '../../components/FormField.jsx';
import { EmptyState, ErrorMessage, Loading } from '../../components/Feedback.jsx';

export default function ManageAreas() {
  const list = useFetch(() => catalog.getAreas(), []);

  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [errors, setErrors] = useState(null);
  const [flash, setFlash] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setErrors(null);
  };

  const startEdit = (area) => {
    setEditing(area);
    setName(area.name);
    setErrors(null);
    setFlash(null);
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setFlash(null);
    setError('');

    if (!name.trim()) {
      setErrors({ name: ['O nome da área é obrigatório.'] });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await admin.updateArea(editing.id, { name: name.trim() });
        setFlash('Área atualizada.');
      } else {
        await admin.createArea({ name: name.trim() });
        setFlash('Área criada.');
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

  const remove = async (area) => {
    if (!window.confirm(`Excluir a área “${area.name}”?`)) return;
    setFlash(null);
    setError('');
    try {
      await admin.deleteArea(area.id);
      if (editing?.id === area.id) resetForm();
      setFlash('Área excluída.');
      list.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <form className="painel-form" onSubmit={submit} noValidate>
        <h3>{editing ? `Editar área: ${editing.name}` : 'Nova área'}</h3>
        <FormField label="Nome da área" name="area-name" error={fieldError(errors, 'name')}>
          <input id="area-name" value={name} onChange={(event) => setName(event.target.value)} />
        </FormField>
        <div className="form-acoes">
          <button type="submit" className="btn btn-primary btn-pequeno" disabled={saving}>
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar área'}
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
          <EmptyState>Nenhuma área cadastrada.</EmptyState>
        ) : (
          <ul className="admin-lista">
            {list.data.map((area) => (
              <li key={area.id} className="admin-item">
                <div>
                  <strong>{area.name}</strong>
                  <small>
                    {area.slug} · {plural(area.journals_count ?? 0, 'revista', 'revistas')}
                  </small>
                </div>
                <div className="meu-artigo-acoes">
                  <button type="button" className="btn btn-ghost btn-pequeno" onClick={() => startEdit(area)}>
                    Editar
                  </button>
                  <button type="button" className="btn btn-perigo btn-pequeno" onClick={() => remove(area)}>
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
