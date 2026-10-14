import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fieldError, initials, roleLabel } from '../utils/format.js';
import FormField from '../components/FormField.jsx';

export default function Account() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email,
    institution: user.institution ?? '',
  });
  const [profileErrors, setProfileErrors] = useState(null);
  const [profileMsg, setProfileMsg] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const emptyPasswords = { current_password: '', password: '', password_confirmation: '' };
  const [passwords, setPasswords] = useState(emptyPasswords);
  const [passwordErrors, setPasswordErrors] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const submitProfile = async (event) => {
    event.preventDefault();
    setProfileErrors(null);
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      const updated = await auth.updateProfile(profile);
      updateUser(updated);
      setProfileMsg({ type: 'sucesso', text: 'Dados atualizados com sucesso.' });
    } catch (err) {
      setProfileErrors(err.errors);
      setProfileMsg({ type: 'erro', text: err.errors ? 'Corrija os campos destacados.' : err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setPasswordErrors(null);
    setPasswordMsg(null);
    setSavingPassword(true);
    try {
      await auth.changePassword(passwords);
      setPasswords(emptyPasswords);
      setPasswordMsg({ type: 'sucesso', text: 'Senha alterada com sucesso.' });
    } catch (err) {
      setPasswordErrors(err.errors);
      setPasswordMsg({ type: 'erro', text: err.errors ? 'Corrija os campos destacados.' : err.message });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    // Navega antes de encerrar a sessão: assim a rota protegida não redireciona para o login.
    navigate('/');
    await logout();
  };

  const memberSince = user.created_at ? new Date(user.created_at).getFullYear() : '—';

  return (
    <>
      <section className="perfil-topo">
        <div className="avatar" aria-hidden="true">
          {initials(user.name)}
        </div>
        <div>
          <h1>Olá, {user.name.split(' ')[0]} 👋</h1>
          <p>
            Membro desde {memberSince} • {roleLabel(user.role)}
          </p>
        </div>
      </section>

      <section className="dashboard">
        <div className="card-dashboard">
          <h3>🎓 Perfil de acesso</h3>
          <span>{roleLabel(user.role)}</span>
        </div>
        <div className="card-dashboard">
          <h3>🏛️ Instituição</h3>
          <span>{user.institution || '—'}</span>
        </div>
        <div className="card-dashboard">
          <h3>📅 Membro desde</h3>
          <span>{memberSince}</span>
        </div>
      </section>

      <section className="secao-conta">
        <h2>⚙️ Dados da conta</h2>
        <form className="painel" onSubmit={submitProfile} noValidate>
          {profileMsg && (
            <div className={`alerta alerta-${profileMsg.type}`} role={profileMsg.type === 'erro' ? 'alert' : 'status'}>
              {profileMsg.text}
            </div>
          )}

          <FormField label="Nome" name="profile-name" error={fieldError(profileErrors, 'name')}>
            <input
              id="profile-name"
              value={profile.name}
              onChange={(event) => setProfile({ ...profile, name: event.target.value })}
            />
          </FormField>

          <FormField label="E-mail" name="profile-email" error={fieldError(profileErrors, 'email')}>
            <input
              id="profile-email"
              type="email"
              value={profile.email}
              onChange={(event) => setProfile({ ...profile, email: event.target.value })}
            />
          </FormField>

          <FormField label="Instituição" name="profile-institution" error={fieldError(profileErrors, 'institution')}>
            <input
              id="profile-institution"
              value={profile.institution}
              onChange={(event) => setProfile({ ...profile, institution: event.target.value })}
            />
          </FormField>

          <button type="submit" className="btn btn-primary" disabled={savingProfile}>
            {savingProfile ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </section>

      <section className="secao-conta">
        <h2>🔒 Alterar senha</h2>
        <form className="painel" onSubmit={submitPassword} noValidate>
          {passwordMsg && (
            <div className={`alerta alerta-${passwordMsg.type}`} role={passwordMsg.type === 'erro' ? 'alert' : 'status'}>
              {passwordMsg.text}
            </div>
          )}

          <FormField label="Senha atual" name="current_password" error={fieldError(passwordErrors, 'current_password')}>
            <input
              id="current_password"
              type="password"
              autoComplete="current-password"
              value={passwords.current_password}
              onChange={(event) => setPasswords({ ...passwords, current_password: event.target.value })}
            />
          </FormField>

          <FormField
            label="Nova senha"
            name="new_password"
            hint="Mínimo de 8 caracteres."
            error={fieldError(passwordErrors, 'password')}
          >
            <input
              id="new_password"
              type="password"
              autoComplete="new-password"
              value={passwords.password}
              onChange={(event) => setPasswords({ ...passwords, password: event.target.value })}
            />
          </FormField>

          <FormField label="Confirmar nova senha" name="new_password_confirmation">
            <input
              id="new_password_confirmation"
              type="password"
              autoComplete="new-password"
              value={passwords.password_confirmation}
              onChange={(event) => setPasswords({ ...passwords, password_confirmation: event.target.value })}
            />
          </FormField>

          <button type="submit" className="btn btn-dark" disabled={savingPassword}>
            {savingPassword ? 'Alterando...' : 'Alterar senha'}
          </button>
        </form>
      </section>

      <section className="secao-conta">
        <button type="button" className="btn btn-ghost-escuro" onClick={handleLogout}>
          Sair da conta
        </button>
      </section>
    </>
  );
}
