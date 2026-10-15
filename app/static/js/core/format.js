const dateFormat = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
const relativeFormat = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

const DAY = 86_400_000;
const HOUR = 3_600_000;

/** 12 mar 2026 */
export const formatDate = (iso) => dateFormat.format(new Date(iso));

/** "hace 3 días", "mañana", "en 2 horas". */
export function formatRelative(iso) {
  const diff = new Date(iso) - Date.now();
  if (Math.abs(diff) >= DAY) return relativeFormat.format(Math.round(diff / DAY), 'day');
  if (Math.abs(diff) >= HOUR) return relativeFormat.format(Math.round(diff / HOUR), 'hour');
  return 'hace un momento';
}

/** Iniciales para avatares: "Camila Rojas" -> "CR". */
export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

/** plural(3, 'integrante') -> "3 integrantes". */
export const plural = (count, singular, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`;
