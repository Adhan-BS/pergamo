// Cliente HTTP único da aplicação: cuida da URL base, do token e dos erros.
const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const TOKEN_KEY = 'pergamo_token';

export const UNAUTHORIZED_EVENT = 'pergamo:unauthorized';

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* armazenamento indisponível */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* armazenamento indisponível */
    }
  },
};

export class ApiError extends Error {
  constructor(message, status = 0, errors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors; // erros de validação por campo (status 422)
  }
}

function buildQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function request(path, { method = 'GET', body, params, headers } = {}) {
  const finalHeaders = { Accept: 'application/json', ...headers };

  const token = tokenStore.get();
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  let payload;
  if (body instanceof FormData) {
    payload = body; // o navegador define o Content-Type com o boundary
  } else if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}${buildQuery(params)}`, {
      method,
      headers: finalHeaders,
      body: payload,
    });
  } catch {
    throw new ApiError(
      'Não foi possível conectar à API. Confira se o servidor Laravel está rodando (php artisan serve).',
    );
  }

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    /* resposta sem corpo JSON */
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      // token inválido ou expirado: a sessão acabou
      tokenStore.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(data?.message ?? `Erro ${response.status}`, response.status, data?.errors ?? null);
  }

  return data;
}
