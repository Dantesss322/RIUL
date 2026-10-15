/**
 * Componentes de interfaz de RIUL.
 *
 * Cada funcion devuelve un fragmento HTML (Raw) y no conoce el negocio; las paginas los combinan.
 * Los datos que llegan del servidor se escapan automaticamente (ver html.js).
 * Los iconos son de Remix Icon: icon('home-5-line') dibuja <i class="ri-home-5-line">.
 */
import { html, raw, escapeHtml, mount, on } from './html.js';
import { ESTADOS } from './dominio.js';
import { initials } from './format.js';
import { formValues } from './form.js';

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

let contador = 0;
/** Identificador unico para enlazar <label> con su control. */
const uid = () => `campo-${++contador}`;

/** Atributos HTML a partir de un objeto: { 'data-id': 3, disabled: true } */
export function attrs(values = {}) {
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

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50';
const VARIANTS = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  secondary: 'border border-line bg-surface text-ink hover:bg-canvas',
  ghost: 'text-accent hover:bg-accent-soft',
  danger: 'bg-danger text-white hover:opacity-90',
};
const SIZES = { sm: 'h-8 px-3.5 text-sm', md: 'h-10 px-5 text-[15px]', lg: 'h-12 px-7 text-base' };

export const buttonClass = ({ variant = 'primary', size = 'md', className = '' } = {}) =>
  [BASE, VARIANTS[variant], SIZES[size], className].filter(Boolean).join(' ');

/** <button>. `type` es "button" por defecto para evitar envios accidentales. */
export function button({ children = '', variant, size, icon: iconName, type = 'button', className = '', ...rest }) {
  return html`<button type="${type}" class="${buttonClass({ variant, size, className })}" ${attrs(rest)}>${
    iconName ? icon(iconName) : ''
  }${children}</button>`;
}

/** <a> con aspecto de boton. */
export function linkButton({ href, children = '', variant, size, icon: iconName, className = '', ...rest }) {
  return html`<a href="${href}" class="${buttonClass({ variant, size, className })}" ${attrs(rest)}>${
    iconName ? icon(iconName) : ''
  }${children}</a>`;
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

const TONES = {
  neutral: 'bg-canvas text-ink-soft',
  info: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

export const badge = (tone, children) =>
  html`<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone] ?? TONES.neutral}">${children}</span>`;

/** Badge a partir de un estado del dominio (pendiente, aprobado, en_validacion...). */
export function estadoBadge(estado) {
  const { label, tone } = ESTADOS[estado] ?? { label: estado, tone: 'neutral' };
  return badge(tone, label);
}

const AVATAR_SIZES = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg' };

export const avatar = (name, size = 'md') =>
  html`<span aria-hidden="true" class="inline-flex shrink-0 items-center justify-center rounded-full bg-canvas font-semibold text-ink-soft ${AVATAR_SIZES[size]}">${initials(name)}</span>`;

export function card({ title, action, className = '' } = {}, children = '') {
  return html`<section class="rounded-card border border-line/70 bg-surface p-4 shadow-card sm:p-5 ${className}">${
    title || action
      ? html`<header class="mb-3 flex items-center justify-between gap-3">${
          title ? html`<h2 class="text-[17px] font-semibold tracking-tight">${title}</h2>` : ''
        }${action ?? ''}</header>`
      : ''
  }${children}</section>`;
}

export function pageHeader({ title, description, actions }) {
  return html`<header class="mb-5 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">${title}</h1>
      ${description ? html`<p class="mt-1 max-w-2xl text-ink-soft">${description}</p>` : ''}
    </div>
    ${actions ? html`<div class="flex flex-wrap items-center gap-3">${actions}</div>` : ''}
  </header>`;
}

export function stat({ label, value, hint, icon: iconName }) {
  return html`<div class="rounded-card border border-line/70 bg-surface p-5 shadow-card">
    <div class="flex items-center justify-between text-sm text-ink-soft"><span>${label}</span>${iconName ? icon(iconName) : ''}</div>
    <p class="mt-2 text-3xl font-semibold tracking-tight tabular-nums">${value}</p>
    ${hint ? html`<p class="mt-1 text-sm text-ink-soft">${hint}</p>` : ''}
  </div>`;
}

export const emptyState = ({ icon: iconName, title, description, action } = {}) =>
  html`<div class="flex flex-col items-center gap-2 px-6 py-12 text-center">
    ${iconName ? icon(iconName, { size: 32, className: 'text-ink-soft/60' }) : ''}
    <p class="font-medium">${title}</p>
    ${description ? html`<p class="max-w-sm text-sm text-ink-soft">${description}</p>` : ''}
    ${action ? html`<div class="mt-3">${action}</div>` : ''}
  </div>`;

export const spinner = () =>
  html`<div class="flex justify-center py-16" role="status" aria-label="Cargando">${icon('loader-4-line', { size: 28, className: 'animate-spin text-ink-soft' })}</div>`;

/** Estado de error con boton "Reintentar" (data-action="reintentar"). */
export const errorState = () =>
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

export const progressBar = (value, label = 'Progreso') =>
  html`<div role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}" class="h-2 overflow-hidden rounded-full bg-canvas"><div class="h-full rounded-full bg-accent transition-all duration-500" style="width:${value}%"></div></div>`;

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
      <div class="h-2 overflow-hidden rounded-full bg-canvas"><div class="h-full rounded-full bg-accent/80" style="width:${(item.value / max) * 100}%" aria-hidden="true"></div></div>
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

/* ------------------------------------------------------------------ */
/* Pestañas y tablas                                                   */
/* ------------------------------------------------------------------ */

/** Control segmentado. Cada pestaña lleva data-tab="id"; la pagina decide que hacer al hacer clic. */
export function tabs(items, value) {
  return html`<div role="tablist" class="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-black/5 p-1">${items.map(
    (tab) => html`<button type="button" role="tab" data-tab="${tab.id}" aria-selected="${tab.id === value}" class="flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
      tab.id === value ? 'bg-surface shadow-sm' : 'text-ink-soft hover:text-ink'
    }">${tab.label}${tab.count > 0 ? html`<span class="rounded-full bg-accent px-1.5 text-xs leading-5 text-white">${tab.count}</span>` : ''}</button>`,
  )}</div>`;
}

/** Tabla responsive. columns: [{header, cell: (fila) => Raw|texto, className}] */
export function dataTable(columns, rows) {
  return html`<div class="-mx-5 overflow-x-auto sm:mx-0"><table class="w-full min-w-[32rem] text-left text-[15px]">
    <thead><tr class="border-b border-line text-sm text-ink-soft">${columns.map(
      (c) => html`<th scope="col" class="px-5 py-3 font-medium sm:px-3">${c.header}</th>`,
    )}</tr></thead>
    <tbody>${rows.map(
      (row) => html`<tr class="border-b border-line/60 last:border-0">${columns.map(
        (c) => html`<td class="px-5 py-3 align-middle sm:px-3 ${c.className ?? ''}">${c.cell(row)}</td>`,
      )}</tr>`,
    )}</tbody>
  </table></div>`;
}

/* ------------------------------------------------------------------ */
/* Campos de formulario                                                */
/* ------------------------------------------------------------------ */

const CONTROL =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] placeholder:text-ink-soft/70 transition-colors hover:border-ink-soft/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-canvas disabled:text-ink-soft';

const conIcono = (iconName, control) =>
  iconName
    ? html`<div class="relative"><span class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-soft">${icon(iconName)}</span>${control}</div>`
    : control;

/**
 * Campo accesible: etiqueta + control + ayuda.
 * type: text | email | password | date | number | tel | search | select | textarea | file | checkbox
 */
export function field({
  label,
  name,
  type = 'text',
  value = '',
  options = [],
  placeholder = '',
  icon: iconName,
  hint = '',
  className = '',
  rows = 4,
  ...rest
}) {
  const id = uid();
  const comunes = { id, name, ...rest };

  if (type === 'checkbox') {
    return html`<label class="flex cursor-pointer items-start gap-3 text-[15px] ${className}">
      <input type="checkbox" class="mt-0.5 size-5 accent-accent" ${attrs({ ...comunes, checked: Boolean(value) })} />
      <span>${label}${hint ? html`<span class="block text-sm text-ink-soft">${hint}</span>` : ''}</span>
    </label>`;
  }

  let control;
  if (type === 'select') {
    control = conIcono(
      iconName,
      html`<select class="${CONTROL} ${iconName ? 'pl-10' : ''}" ${attrs(comunes)}>
        <option value="">${placeholder || 'Selecciona una opción'}</option>
        ${options.map((o) => html`<option value="${o.value}" ${attrs({ selected: String(o.value) === String(value) })}>${o.label}</option>`)}
      </select>`,
    );
  } else if (type === 'textarea') {
    control = html`<textarea class="${CONTROL}" rows="${rows}" ${attrs({ ...comunes, placeholder })}>${value}</textarea>`;
  } else if (type === 'file') {
    control = html`<label for="${id}" class="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-ink-soft/40 bg-canvas/60 px-4 py-6 text-center text-sm text-ink-soft transition-colors hover:border-accent hover:bg-accent-soft/40 focus-within:border-accent">
      ${icon(value ? 'attachment-2' : 'upload-cloud-2-line', { size: 22 })}
      <span class="font-medium text-ink" data-file-name>${value?.name || 'Subir archivo'}</span>
      <span ${attrs({ hidden: Boolean(value) })} data-file-help>PDF, imagen o documento de hasta 10 MB</span>
      <input type="file" class="sr-only" ${attrs(comunes)} />
    </label>`;
  } else if (type === 'password') {
    // El boton del ojo va dentro del contenedor relativo, junto al campo.
    control = html`<div class="relative">${
      iconName ? html`<span class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-soft">${icon(iconName)}</span>` : ''
    }<input type="password" class="${CONTROL} ${iconName ? 'pl-10' : ''} pr-11" ${attrs({ ...comunes, placeholder })} /><button type="button" data-toggle-password aria-label="Mostrar contraseña" class="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-ink-soft transition-colors hover:bg-canvas hover:text-ink">${icon('eye-line')}</button></div>`;
  } else {
    control = conIcono(
      iconName,
      html`<input type="${type}" class="${CONTROL} ${iconName ? 'pl-10' : ''}" ${attrs({ ...comunes, value, placeholder })} />`,
    );
  }

  return html`<div class="flex flex-col gap-1.5 ${className}">
    <label for="${id}" class="text-sm font-medium">${label}</label>
    ${control}
    ${hint ? html`<p class="text-sm text-ink-soft">${hint}</p>` : ''}
  </div>`;
}

/** Panel blanco central de las pantallas de acceso. `wide` lo ensancha para formularios de dos columnas. */
export const authPanel = (content, { wide = false } = {}) =>
  html`<section class="w-full rounded-3xl bg-surface p-5 shadow-2xl shadow-black/30 sm:p-6 ${wide ? 'max-w-lg' : 'max-w-md'}">${content}</section>`;

/* ------------------------------------------------------------------ */
/* Ventana modal                                                       */
/* ------------------------------------------------------------------ */

/**
 * Abre un modal sobre <dialog> nativo (foco atrapado, cierre con Esc y fondo oscurecido).
 * Devuelve el elemento <dialog>; se elimina del DOM al cerrarse.
 */
export function openModal({ title, body }) {
  const dialog = document.createElement('dialog');
  dialog.className =
    'm-auto w-[min(92vw,34rem)] rounded-card bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/30 backdrop:backdrop-blur-sm';
  mount(
    dialog,
    html`<div class="p-6">
      <header class="mb-5 flex items-start justify-between gap-4">
        <h2 class="text-xl font-semibold tracking-tight">${title}</h2>
        <button type="button" data-close aria-label="Cerrar" class="-m-1 rounded-full p-1 text-ink-soft transition-colors hover:bg-canvas">${icon('close-line', { size: 22 })}</button>
      </header>
      <div data-modal-body>${body}</div>
    </div>`,
  );
  document.body.append(dialog);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.closest('[data-close]')) dialog.close();
  });
  dialog.addEventListener('close', () => dialog.remove());
  dialog.showModal();
  return dialog;
}

/**
 * Modal con un formulario. `onSubmit(values, form)` recibe los valores del formulario; si devuelve
 * un valor verdadero el modal se cierra (los errores ya los notifica el cliente HTTP).
 * Usa la validacion nativa del navegador (required, minlength...).
 */
export function formModal({ title, body, submitLabel = 'Guardar', onSubmit }) {
  const dialog = openModal({
    title,
    body: html`<form class="space-y-4">
      ${body}
      <div class="flex justify-end gap-3 pt-2">
        ${button({ variant: 'secondary', children: 'Cancelar', 'data-close': true })}
        ${button({ type: 'submit', children: submitLabel })}
      </div>
    </form>`,
  });

  const form = dialog.querySelector('form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const hecho = await withLoading(form.querySelector('[type="submit"]'), () => intentar(() => onSubmit(formValues(form), form)));
    if (hecho) dialog.close();
  });
  return dialog;
}

/* ------------------------------------------------------------------ */
/* Asistente por pasos                                                 */
/* ------------------------------------------------------------------ */

/**
 * Asistente de pasos (RNF-3: los flujos de logros y publicaciones no superan 4 pasos).
 *
 * @param {object} options
 * @param {HTMLElement} options.root       Contenedor donde se dibuja.
 * @param {{label: string, isValid?: (values: object) => boolean, render: (values: object) => Raw}[]} options.steps
 * @param {string} options.submitLabel
 * @param {(values: object) => Promise<void>} options.onSubmit   Recibe todos los valores al terminar.
 */
export function wizard({ root, steps, submitLabel, onSubmit }) {
  const values = {};
  let index = 0;

  const stepper = () =>
    html`<ol class="mb-6 flex flex-wrap items-center gap-2" aria-label="Progreso">${steps.map((step, i) => {
      const estado = i === index ? 'bg-ink text-white' : i < index ? 'bg-success-soft text-success' : 'bg-black/5 text-ink-soft';
      return html`<li ${attrs({ 'aria-current': i === index ? 'step' : null })} class="flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${estado}">${
        i < index ? icon('check-line', { size: 16 }) : html`<span aria-hidden="true">${i + 1}</span>`
      }${step.label}</li>`;
    })}</ol>`;

  const dibujar = () => {
    const ultimo = index === steps.length - 1;
    mount(
      root,
      html`${stepper()}<form novalidate>
        <section class="space-y-5 rounded-card border border-line/70 bg-surface p-4 shadow-card sm:p-5">${steps[index].render(values)}</section>
        <div class="mt-5 flex items-center justify-between">
          ${button({ variant: 'secondary', icon: 'arrow-left-line', children: 'Atrás', 'data-back': true, disabled: index === 0 })}
          ${button({ type: 'submit', children: ultimo ? submitLabel : 'Continuar', 'data-next': true })}
        </div>
      </form>`,
    );
    actualizarBoton();
  };

  const actualizarBoton = () => {
    const paso = steps[index];
    root.querySelector('[data-next]').disabled = paso.isValid ? !paso.isValid(values) : false;
  };

  const leer = (event) => {
    const target = event.target;
    if (!target.name) return;
    values[target.name] = target.type === 'checkbox' ? target.checked : target.type === 'file' ? (target.files[0] ?? null) : target.value;
    actualizarBoton();
  };
  root.addEventListener('input', leer);
  root.addEventListener('change', leer);

  on(root, 'click', '[data-back]', () => {
    index -= 1;
    dibujar();
  });

  root.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (index < steps.length - 1) {
      index += 1;
      dibujar();
      return;
    }
    await withLoading(root.querySelector('[data-next]'), () => onSubmit(values));
  });

  dibujar();
}

/* ------------------------------------------------------------------ */
/* Comportamientos globales                                            */
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
    const label = input.closest('label');
    label.querySelector('[data-file-name]').textContent = input.files[0]?.name ?? 'Subir archivo';
    label.querySelector('[data-file-help]').hidden = Boolean(input.files[0]);
  });
}

/**
 * Carga datos y dibuja el resultado: indicador de carga, estado de error con "Reintentar"
 * y vista final. Equivale al antiguo QueryState.
 */
export async function cargar(root, loader, vista) {
  mount(root, spinner());
  try {
    const data = await loader();
    await vista(data);
  } catch {
    // Las alertas ya las mostro el cliente HTTP; aqui solo se ofrece reintentar.
    mount(root, errorState());
    root.querySelector('[data-action="reintentar"]')?.addEventListener('click', () => cargar(root, loader, vista));
  }
}

export { html, raw, mount, on, escapeHtml };
