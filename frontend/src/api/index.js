import { request } from './client.js';

// ---------- Autenticação e perfil ----------
export const auth = {
  register: (data) => request('/register', { method: 'POST', body: data }),
  login: (email, password) => request('/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/logout', { method: 'POST' }),
  me: () => request('/me').then((r) => r.user),
  updateProfile: (data) => request('/me', { method: 'PUT', body: data }).then((r) => r.user),
  changePassword: (data) => request('/me/password', { method: 'PUT', body: data }),
};

// ---------- Catálogo público ----------
export const catalog = {
  getAreas: () => request('/areas').then((r) => r.data),
  getJournals: (params) => request('/journals', { params }).then((r) => r.data),
  getJournal: (id) => request(`/journals/${id}`).then((r) => r.data),
  getIssues: (params) => request('/issues', { params }), // paginado: { data, meta }
  getIssue: (id) => request(`/issues/${id}`).then((r) => r.data),
  getArticles: (params) => request('/articles', { params }), // paginado: { data, meta }
  getArticle: (id) => request(`/articles/${id}`).then((r) => r.data),
};

// ---------- Área do pesquisador ----------
export const researcher = {
  list: (page) => request('/my/articles', { params: { page } }), // paginado: { data, meta }
  get: (id) => request(`/my/articles/${id}`).then((r) => r.data),
  create: (formData) => request('/articles', { method: 'POST', body: formData }).then((r) => r.data),
  update: (id, data) => request(`/articles/${id}`, { method: 'PUT', body: data }).then((r) => r.data),
  replaceFile: (id, formData) =>
    request(`/articles/${id}/file`, { method: 'POST', body: formData }).then((r) => r.data),
  submit: (id) => request(`/articles/${id}/submit`, { method: 'POST' }).then((r) => r.data),
  remove: (id) => request(`/articles/${id}`, { method: 'DELETE' }),
};
