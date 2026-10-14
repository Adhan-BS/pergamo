import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { fieldError } from '../utils/format.js';
import FormField from '../components/FormField.jsx';

const ROLES = [
  { value: 'leitor', title: 'Leitor', text: 'Navegue, leia e baixe artigos.' },
  { value: 'pesquisador', title: 'Pesquisador', text: 'Envie e gerencie os seus artigos.' },
];

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    institution: '',
    role: 'leitor',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState(null);
  const [sending, setSending] = useState(false);

  if (user) return <Navigate to="/conta" replace />;

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setErrors(null);
    setSending(true);
    try {
      await register(form);
      navigate('/conta', { replace: true });
    } catch (err) {
      setErrors(err.errors);
      setError(err.errors ? 'Corrija os campos destacados.' : err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="container">
      <form className="form-card" onSubmit={submit} noValidate>
        <h2>Criar conta</h2>
        <p className="form-intro">É gratuito. Escolha como você vai usar o Pérgamo.</p>

        {error && (
          <div className="alerta alerta-erro" role="alert">
            {error}
          </div>
        )}

        <fieldset className="perfis">
          <legend>Tipo de conta</legend>
          {ROLES.map((role) => (
            <label key={role.value} className={`perfil-opcao${form.role === role.value ? ' selecionado' : ''}`}>
              <input type="radio" name="role" value={role.value} checked={form.role === role.value} onChange={change} />
              <strong>{role.title}</strong>
              <span>{role.text}</span>
            </label>
          ))}
          {fieldError(errors, 'role') && <small className="erro">{fieldError(errors, 'role')}</small>}
        </fieldset>

        <FormField label="Nome completo" name="name" error={fieldError(errors, 'name')}>
          <input id="name" name="name" autoComplete="name" value={form.name} onChange={change} required />
        </FormField>

        <FormField label="E-mail" name="email" error={fieldError(errors, 'email')}>
          <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} required />
        </FormField>

        <FormField
          label="Instituição (opcional)"
          name="institution"
          error={fieldError(errors, 'institution')}
        >
          <input id="institution" name="institution" value={form.institution} onChange={change} />
        </FormField>

        <FormField label="Senha" name="password" hint="Mínimo de 8 caracteres." error={fieldError(errors, 'password')}>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={change}
            required
          />
        </FormField>

        <FormField label="Confirmar senha" name="password_confirmation">
          <input
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            value={form.password_confirmation}
            onChange={change}
            required
          />
        </FormField>

        <button type="submit" className="btn btn-primary btn-bloco" disabled={sending}>
          {sending ? 'Criando conta...' : 'Criar conta'}
        </button>

        <p className="form-rodape">
          Já tem conta? <Link to="/entrar">Entrar</Link>
        </p>
      </form>
    </section>
  );
}
