import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/logo.png';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [term, setTerm] = useState('');

  // Fecha o menu mobile ao trocar de página.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = term.trim();
    navigate(query ? `/artigos?q=${encodeURIComponent(query)}` : '/artigos');
    setTerm('');
  };

  const handleLogout = async () => {
    // Navega antes de encerrar a sessão: assim a rota protegida não redireciona para o login.
    navigate('/');
    await logout();
  };

  return (
    <header className="site-header">
      <Link to="/" className="logo-area">
        <img src={logo} alt="Logo do Pérgamo" />
        <div>
          <h1>PÉRGAMO</h1>
          <p>Ciência sem Fronteiras</p>
        </div>
      </Link>

      <button
        type="button"
        className="menu-mobile"
        aria-label="Abrir ou fechar o menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        ☰
      </button>

      <nav className={menuOpen ? 'aberto' : ''}>
        <NavLink to="/" end>
          Início
        </NavLink>
        <NavLink to="/artigos">Artigos</NavLink>
        <NavLink to="/revistas">Revistas</NavLink>
        <NavLink to="/sobre">Sobre</NavLink>

        {user ? (
          <>
            <NavLink to="/conta">Conta</NavLink>
            <button type="button" className="nav-btn" onClick={handleLogout}>
              Sair
            </button>
          </>
        ) : (
          <>
            <NavLink to="/entrar">Entrar</NavLink>
            <NavLink to="/cadastro" className="destaque">
              Cadastrar
            </NavLink>
          </>
        )}
      </nav>

      <form className="pesquisa" onSubmit={handleSearch} role="search">
        <input
          type="text"
          placeholder="Pesquisar artigos..."
          aria-label="Pesquisar artigos"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />
        <button type="submit" aria-label="Pesquisar">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>
      </form>
    </header>
  );
}
