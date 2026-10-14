import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="container estado">
      <h2>Página não encontrada</h2>
      <p>O endereço que você tentou acessar não existe.</p>
      <Link to="/" className="btn btn-dark">
        Voltar ao início
      </Link>
    </section>
  );
}
