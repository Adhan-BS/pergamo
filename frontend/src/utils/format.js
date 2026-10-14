export function formatDate(value) {
  if (!value) return '';

  // "2026-09-01" (só data) deve ser lido como data local, senão aparece um dia antes no Brasil.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);

  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function truncate(text = '', max = 240) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

const ROLES = { leitor: 'Leitor', pesquisador: 'Pesquisador', admin: 'Administrador' };
export const roleLabel = (role) => ROLES[role] ?? role;

const AREA_ICONS = {
  exatas: '📐',
  humanas: '📖',
  saude: '🩺',
  tecnologia: '💻',
  biologicas: '🧬',
};
export const areaIcon = (slug) => AREA_ICONS[slug] ?? '📚';

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

/** Primeira mensagem de erro de um campo, vinda da validação da API. */
export const fieldError = (errors, field) => errors?.[field]?.[0];

export const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
