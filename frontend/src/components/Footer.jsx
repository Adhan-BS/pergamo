import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <h3>PÉRGAMO</h3>
        <p>Ciência sem Fronteiras</p>
        <span>© {new Date().getFullYear()} Pérgamo · Projeto acadêmico de Back-end Frameworks</span>
      </div>
      <div className="footer-links">
        <Link to="/artigos">Artigos</Link>
        <Link to="/revistas">Revistas</Link>
        <Link to="/sobre">Sobre</Link>
      </div>
    </footer>
  );
}
