/**
 * Exploracion publica (RF-8.1, RF-8.2): semilleros, proyectos o eventos sin autenticacion.
 * El tipo llega desde la URL (/explorar/<tipo>) a traves de data-tipo del <body>; el encabezado y las
 * pestanas los escribe templates/explorar.html.
 */
import { html, mount, badge, card, cargar, emptyState, icon, levelStars } from '../core/ui.js';
import { publicoApi } from '../core/api.js';
import { ESTADOS } from '../core/dominio.js';
import { formatDate, plural } from '../core/format.js';

/** Cada categoria define como se dibuja un elemento de su listado. */
const ITEM = {
  semilleros: (s) =>
    card({}, html`<p class="text-sm text-ink-soft">${s.facultad}</p>
      <h2 class="mt-1 text-lg font-semibold tracking-tight">${s.nombre}</h2>
      <p class="mt-2 text-ink-soft">${s.descripcion}</p>
      <div class="mt-4 flex items-center justify-between text-sm text-ink-soft">${levelStars(s.nivel)}<span>${plural(s.totalIntegrantes, 'integrante')}</span></div>`),
  proyectos: (p) =>
    card({}, html`<p class="text-sm text-ink-soft">${p.semillero} · ${p.facultad}</p>
      <h2 class="mt-1 text-lg font-semibold tracking-tight">${p.nombre}</h2>
      <p class="mt-2 text-ink-soft">${p.descripcion}</p>
      <div class="mt-4">${badge(ESTADOS[p.estado].tone, ESTADOS[p.estado].label)}</div>`),
  eventos: (e) =>
    card({}, html`<h2 class="text-lg font-semibold tracking-tight">${e.nombre}</h2>
      <p class="mt-2 text-ink-soft">${e.descripcion}</p>
      <ul class="mt-4 space-y-1 text-sm text-ink-soft">
        <li class="flex items-center gap-2">${icon('calendar-event-line', { size: 16 })} ${formatDate(e.fecha)} · ${e.modalidad}</li>
        <li class="flex items-center gap-2">${icon('map-pin-line', { size: 16 })} ${e.lugar}</li>
      </ul>`),
};

export default function iniciar({ root, params }) {
  const listado = root.querySelector('[data-region="listado"]');

  cargar(listado, () => publicoApi.listar(params.tipo), (filas) =>
    mount(
      listado,
      filas.length === 0
        ? emptyState({ title: 'No hay contenido público por ahora.' })
        : html`<div class="grid gap-4 md:grid-cols-2">${filas.map(ITEM[params.tipo])}</div>`,
    ),
  );
}
