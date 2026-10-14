import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../api/index.js';
import { tokenStore, UNAUTHORIZED_EVENT } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Só "carrega" se existe um token guardado para validar.
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));

  // Ao abrir o site, recupera o usuário do token guardado.
  useEffect(() => {
    if (!tokenStore.get()) return undefined;

    let active = true;
    auth
      .me()
      .then((me) => active && setUser(me))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  // Se a API recusar o token em qualquer requisição, encerra a sessão local.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: loggedUser, token } = await auth.login(email, password);
    tokenStore.set(token);
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const register = useCallback(async (data) => {
    const { user: newUser, token } = await auth.register(data);
    tokenStore.set(token);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await auth.logout();
    } catch {
      /* mesmo se a API falhar, encerra a sessão local */
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateUser: setUser }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return context;
}
