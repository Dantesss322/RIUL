/**
 * Componentes de interfaz de RIUL que se generan con datos (listas, tarjetas, filas).
 *
 * Cada funcion devuelve un fragmento HTML (Raw) y no conoce el negocio; las paginas los combinan.
 * El marco estatico de cada pantalla (encabezados, formularios, pestanas) vive en templates/;
 * aqui solo esta lo que depende de los datos. El estilo viene de las clases de static/css/app.css.
 * Los datos que llegan del servidor se escapan automaticamente (ver html.js).
 * Los iconos son de Remix Icon: icon('home-5-line') dibuja <i class="ri-home-5-line">.
 */
import { html, raw, escapeHtml, mount, on } from './html.js';
import { ESTADOS } from './dominio.js';
import { initials } from './format.js';

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

/** Atributos HTML a partir de un objeto: { 'data-id': 3, disabled: true } */
function attrs(values = {}) {
  return raw(
    Object.entries(values)
      .filter(([, value]) => value !== false && value != null)
      .map(([key, value]) => (value === true ? key : `${key}="${escapeHtml(value)}"`))
      .join(' '),
  );
}

export function icon(name, { size = 18, className = '' } = {}) {
  return html`<i class="ri-${name} ${className}" style="font-size:${size}px;line-height:1" aria-hidden="true"></i>`;
}

/* ------------------------------------------------------------------ */
/* Botones                                                             */
/* ------------------------------------------------------------------ */

const buttonClass = ({ variant = 'primary', size = 'md', className = '' } = {}) =>
  ['btn', `btn-${variant}`, size !== 'md' && `btn-${size}`, className].filter(Boolean).join(' ');

/** <button>. `type` es "button" por defecto para evitar envios accidentales. */
export function button({ children = '', variant, size, icon: iconName, type = 'button', className = '', ...rest }) {
  return html`<button type="${type}" class="${buttonClass({ variant, size, className })}" ${attrs(rest)}>${
    iconName ? icon(iconName) : ''
  }${children}</button>`;
}

/** Ejecuta una accion cuyo error ya fue notificado por el cliente HTTP: evita un rechazo sin atender. */
export async function intentar(accion) {
  try {
    return await accion();
  } catch {
    return undefined;
  }
}

/** Ejecuta una accion asincrona mostrando un indicador de carga y bloqueando el boton. */
export async function withLoading(buttonElement, action) {
  if (!buttonElement) return action();
  const original = buttonElement.innerHTML;
  buttonElement.disabled = true;
  buttonElement.innerHTML = `<i class="ri-loader-4-line animate-spin" style="font-size:18px;line-height:1" aria-hidden="true"></i>${buttonElement.textContent.trim() ? ' ' : ''}${escapeHtml(buttonElement.textContent)}`;
  try {
    return await action();
  } finally {
    // El elemento puede haberse reemplazado al redibujar la pagina.
    if (buttonElement.isConnected) {
      buttonElement.disabled = false;
      buttonElement.innerHTML = original;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Piezas visuales                                                     */
/* ------------------------------------------------------------------ */

export const badge = (tone, children) => html`<span class="badge badge-${tone}">${children}</span>`;

/** Badge a partir de un estado del dominio (pendiente, aprobado, en_validacion...). */
export function estadoBadge(estado) {
  const { label, tone } = ESTADOS[estado] ?? { label: estado, tone: 'neutral' };
  return badge(tone, label);
}

export const avatar = (name, size = 'md') =>
  html`<span aria-hidden="true" class="avatar ${size === 'md' ? '' : `avatar-${size}`}">${initials(name)}</span>`;

export function card({ title, action, className = '' } = {}, children = '') {
  return html`<section class="card ${className}">${
    title || action
      ? html`<header class="card-header">${title ? html`<h2 class="card-title">${title}</h2>` : ''}${action ?? ''}</header>`
      : ''
  }${children}</section>`;
}

export const emptyState = ({ icon: iconName, title, description, action } = {}) =>
  html`<div class="empty-state">
    ${iconName ? icon(iconName, { size: 32, className: 'text-ink-soft/60' }) : ''}
    <p class="font-medium">${title}</p>
    ${description ? html`<p class="max-w-sm text-sm text-ink-soft">${description}</p>` : ''}
    ${action ? html`<div class="mt-3">${action}</div>` : ''}
  </div>`;

const spinner = () =>
  html`<div class="flex justify-center py-16" role="status" aria-label="Cargando">${icon('loader-4-line', { size: 28, className: 'animate-spin text-ink-soft' })}</div>`;

/** Estado de error con boton "Reintentar" (data-action="reintentar"). */
const errorState = () =>
  emptyState({
    icon: 'error-warning-line',
    title: 'No pudimos cargar la información',
    description: 'Revisa tu conexión e inténtalo de nuevo.',
    action: button({ variant: 'secondary', children: 'Reintentar', 'data-action': 'reintentar' }),
  });

/** Nivel como estrellas (1 a `max`). */
export function levelStars(nivel, max = 5) {
  const estrellas = Array.from({ length: max }, (_, i) =>
    i < nivel ? icon('star-fill', { size: 16 }) : icon('star-line', { size: 16, className: 'text-ink-soft/40' }),
  );
  return html`<span class="inline-flex gap-0.5 text-star" role="img" aria-label="Nivel ${nivel} de ${max}">${estrellas}</span>`;
}

const progressBar = (value, label = 'Progreso') =>
  html`<div role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}" class="progress"><div class="progress-bar" style="width:${value}%"></div></div>`;

export function xpProgress({ xp, xpSiguiente, porcentaje }) {
  return html`<div class="space-y-2">${progressBar(porcentaje, 'Progreso hacia el siguiente nivel')}<p class="text-sm text-ink-soft">${
    xpSiguiente ? `${xp} de ${xpSiguiente} XP para el siguiente nivel` : `${xp} XP · nivel máximo alcanzado`
  }</p></div>`;
}

/** Barras horizontales para indicadores comparativos. items: [{label, value, hint}] */
export function barList(items, unit = '') {
  const max = Math.max(...items.map((item) => item.value), 1);
  return html`<ul class="space-y-3">${items.map(
    (item) => html`<li>
      <div class="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span class="truncate">${item.label}</span><span class="shrink-0 font-medium tabular-nums">${item.value}${unit}</span>
      </div>
      <div class="progress"><div class="progress-bar opacity-80" style="width:${(item.value / max) * 100}%" aria-hidden="true"></div></div>
      ${item.hint ? html`<p class="mt-1 text-xs text-ink-soft">${item.hint}</p>` : ''}
    </li>`,
  )}</ul>`;
}

export const evidenceChip = (evidencia) =>
  evidencia
    ? html`<span class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-canvas px-3 py-1 text-sm text-ink-soft">${icon('attachment-2', { className: 'shrink-0' })}<span class="truncate">${evidencia.nombre}</span></span>`
    : '';

/** Iconos disponibles para insignias (clave guardada en insignia.icono). */
const ICONOS_INSIGNIA = {
  medalla: 'medal-line',
  trofeo: 'trophy-line',
  libro: 'book-open-line',
  idea: 'lightbulb-line',
  calendario: 'calendar-event-line',
  equipo: 'team-line',
};

export const insigniaIcon = (name, size = 24) => icon(ICONOS_INSIGNIA[name] ?? 'medal-line', { size });

/** Insignia con su estado (obtenida, en progreso o bloqueada). */
export function insigniaCard({ nombre, descripcion, icono, obtenida, progreso }) {
  return html`<li class="flex items-start gap-3 rounded-2xl border border-line/70 p-4 ${obtenida ? 'bg-surface' : 'bg-canvas/60'}">
    <span class="flex size-11 shrink-0 items-center justify-center rounded-full ${obtenida ? 'bg-accent-soft text-accent' : 'bg-black/5 text-ink-soft/60'}">${insigniaIcon(icono)}</span>
    <div class="min-w-0">
      <p class="font-medium ${obtenida ? '' : 'text-ink-soft'}">${nombre}</p>
      <p class="text-sm text-ink-soft">${descripcion}</p>
      ${progreso && !obtenida ? html`<p class="mt-1 text-xs font-medium text-ink-soft">${progreso.actual} de ${progreso.requerido}</p>` : ''}
    </div>
  </li>`;
}

/** Tabla responsive. columns: [{header, cell: (fila) => Raw|texto, className}] */
export function dataTable(columns, rows) {
  return html`<div class="table-wrap"><table class="table">
    <thead><tr>${columns.map((c) => html`<th scope="col">${c.header}</th>`)}</tr></thead>
    <tbody>${rows.map(
      (row) => html`<tr>${columns.map((c) => html`<td class="${c.className ?? ''}">${c.cell(row)}</td>`)}</tr>`,
    )}</tbody>
  </table></div>`;
}

/* ------------------------------------------------------------------ */
/* Comportamientos globales y carga de datos                           */
/* ------------------------------------------------------------------ */

/** Ojo de contrasenas y nombre del archivo elegido: funcionan en toda pagina sin codigo adicional. */
export function initGlobalBehaviors() {
  on(document, 'click', '[data-toggle-password]', (toggle) => {
    const input = toggle.parentElement.querySelector('input');
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    toggle.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
    toggle.querySelector('i').className = `ri-${visible ? 'eye-off-line' : 'eye-line'}`;
  });

  document.addEventListener('change', (event) => {
    const input = event.target;
    if (input.type !== 'file') return;
    const zona = input.closest('label');
    zona.querySelector('[data-file-name]').textContent = input.files[0]?.name ?? 'Subir archivo';
    zona.querySelector('[data-file-help]').hidden = Boolean(input.files[0]);
  });
}

/**
 * Carga datos y los dibuja DENTRO de `region`: indicador de carga, estado de error con "Reintentar"
 * y vista final. La vista reemplaza el contenido de la region (listas y tarjetas).
 */
export async function cargar(region, loader, vista) {
  mount(region, spinner());
  try {
    const data = await loader();
    await vista(data);
  } catch {
    // Las alertas ya las mostro el cliente HTTP; aqui solo se ofrece reintentar.
    mount(region, errorState());
    region.querySelector('[data-action="reintentar"]')?.addEventListener('click', () => cargar(region, loader, vista));
  }
}

/**
 * Variante para marcos estaticos de la plantilla (con textos y regiones ya escritos): oculta el marco
 * mientras llegan los datos y lo muestra al terminar. La vista completa el marco, no lo reemplaza.
 */
export async function cargarMarco(marco, loader, vista) {
  const aviso = document.createElement('div');
  marco.hidden = true;
  marco.before(aviso);
  mount(aviso, spinner());
  try {
    const data = await loader();
    aviso.remove();
    marco.hidden = false;
    await vista(data);
  } catch {
    mount(aviso, errorState());
    aviso.querySelector('[data-action="reintentar"]')?.addEventListener('click', () => {
      aviso.remove();
      cargarMarco(marco, loader, vista);
    });
  }
}

export { html, raw, mount, on };
