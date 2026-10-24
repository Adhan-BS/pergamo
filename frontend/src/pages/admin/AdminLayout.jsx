import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  ['avaliacao', 'Avaliação'],
  ['areas', 'Áreas'],
  ['revistas', 'Revistas'],
  ['edicoes', 'Edições'],
  ['usuarios', 'Usuários'],
];

export default function AdminLayout() {
  return (
    <section className="container">
      <div className="secao-header">
        <h2>Painel do administrador</h2>
      </div>

      <nav className="abas" aria-label="Seções do painel">
        {TABS.map(([path, label]) => (
          <NavLink key={path} to={path} className={({ isActive }) => `aba${isActive ? ' aba-ativa' : ''}`}>
            {label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </section>
  );
}
