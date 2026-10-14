import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { fieldError } from '../utils/format.js';
import FormField from '../components/FormField.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState(null);
  const [sending, setSending] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setErrors(null);
    setSending(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrors(err.errors);
      setError(err.errors ? 'Confira os campos abaixo.' : err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="container">
      <form className="form-card" onSubmit={submit} noValidate>
        <h2>Entrar</h2>
        <p className="form-intro">Acesse sua conta para enviar artigos e gerenciar seu perfil.</p>

        {error && (
          <div className="alerta alerta-erro" role="alert">
            {error}
          </div>
        )}

        <FormField label="E-mail" name="email" error={fieldError(errors, 'email')}>
          <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} required />
        </FormField>

        <FormField label="Senha" name="password" error={fieldError(errors, 'password')}>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={change}
            required
          />
        </FormField>

        <button type="submit" className="btn btn-primary btn-bloco" disabled={sending}>
          {sending ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="form-rodape">
          Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </form>
    </section>
  );
}
