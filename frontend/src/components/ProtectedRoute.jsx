import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading } from './Feedback.jsx';

/**
 * Só deixa passar quem está logado. Com `roles`, exige também um dos perfis informados.
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading text="Verificando sessão..." />;

  if (!user) return <Navigate to="/entrar" replace state={{ from: location }} />;

  if (roles && !roles.includes(user.role)) {
    return (
      <section className="container estado estado-erro">
        <h2>Acesso negado</h2>
        <p>Seu perfil não tem permissão para acessar esta página.</p>
      </section>
    );
  }

  return children;
}
