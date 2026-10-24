import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { admin } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { plural, roleLabel } from '../../utils/format.js';
import Pagination from '../../components/Pagination.jsx';
import { EmptyState, ErrorMessage, Loading } from '../../components/Feedback.jsx';

const ROLES = ['leitor', 'pesquisador', 'admin'];

export default function ManageUsers() {
  const { user: me } = useAuth();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const role = params.get('role') ?? '';
  const page = Number(params.get('page')) || 1;

  const [term, setTerm] = useState(q);
  useEffect(() => setTerm(q), [q]);

  const list = useFetch(() => admin.listUsers({ q, role, page }), [q, role, page]);

  const [flash, setFlash] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    setParams(next);
  };

  const changeRole = async (target, newRole) => {
    if (newRole === target.role) return;
    if (!window.confirm(`Alterar o perfil de ${target.name} para ${roleLabel(newRole)}?`)) return;

    setFlash(null);
    setError('');
    setBusyId(target.id);
    try {
      await admin.setRole(target.id, newRole);
      setFlash(`${target.name} agora é ${roleLabel(newRole)}.`);
      list.reload();
    } catch (err) {
      setError(err.errors?.role?.[0] ?? err.message);
    } finally {
      setBusyId(null);
    }
  };

  const items = list.data?.data ?? [];
  const hasFilters = Boolean(q || role);

  return (
    <div>
      <form
        className="filtros"
        onSubmit={(event) => {
          event.preventDefault();
          update({ q: term.trim(), page: '' });
        }}
      >
        <input
          type="search"
          placeholder="Buscar por nome ou e-mail"
          aria-label="Buscar usuários"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />
        <select
          aria-label="Filtrar por perfil"
          value={role}
          onChange={(event) => update({ role: event.target.value, page: '' })}
        >
          <option value="">Todos os perfis</option>
          {ROLES.map((value) => (
            <option key={value} value={value}>
              {roleLabel(value)}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Buscar
        </button>
        {hasFilters && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setTerm('');
              setParams(new URLSearchParams());
            }}
          >
            Limpar filtros
          </button>
        )}
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
          <EmptyState>Nenhum usuário encontrado.</EmptyState>
        ) : (
          <ul className="admin-lista">
            {items.map((person) => {
              const isMe = person.id === me?.id;
              return (
                <li key={person.id} className="admin-item">
                  <div>
                    <strong>
                      {person.name}
                      {isMe && <span className="voce"> (você)</span>}
                    </strong>
                    <small>
                      {person.email}
                      {person.institution ? ` · ${person.institution}` : ''} ·{' '}
                      {plural(person.articles_count ?? 0, 'artigo', 'artigos')}
                    </small>
                  </div>
                  <div className="perfil-controle">
                    <label htmlFor={`role-${person.id}`} className="so-leitor-de-tela">
                      Perfil de {person.name}
                    </label>
                    <select
                      id={`role-${person.id}`}
                      value={person.role}
                      disabled={isMe || busyId === person.id}
                      title={isMe ? 'Você não pode alterar o seu próprio perfil' : undefined}
                      onChange={(event) => changeRole(person, event.target.value)}
                    >
                      {ROLES.map((value) => (
                        <option key={value} value={value}>
                          {roleLabel(value)}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
              );
            })}
          </ul>
        ))}

      <Pagination meta={list.data?.meta} onChange={(next) => update({ page: next > 1 ? String(next) : '' })} />
    </div>
  );
}
