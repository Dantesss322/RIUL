/**
 * Semilleros (RF-2.6): pantalla unica. Arriba, los semilleros propios; debajo, la exploracion con
 * busqueda para consultar informacion y solicitar vinculacion.
 */
import { html, mount, button, card, cargar, emptyState, estadoBadge, field, intentar, pageHeader } from '../core/ui.js';
import { semillerosApi, vinculacionesApi } from '../core/api.js';
import { atenderTarjetas, semilleroCard } from '../components/semillero_card.js';

const solicitudes = (filas) =>
  card({ title: 'Mis solicitudes', className: 'mt-6' }, html`<ul class="divide-y divide-line/60">${filas.map(
    (s) => html`<li class="flex items-center justify-between gap-3 py-3">
      <span class="font-medium">${s.semillero}</span>
      ${s.estado === 'pendiente'
        ? html`<span class="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning">Pendiente · aprobación del líder</span>`
        : estadoBadge(s.estado)}
    </li>`,
  )}</ul>`);

export default function iniciar({ root, user }) {
  let termino = '';
  const esMiembro = user.rol !== 'administrador';
  const esEstudiante = user.rol === 'estudiante';

  mount(
    root,
    html`${pageHeader({ title: 'Semilleros', description: 'Tus semilleros y los grupos de investigación de la universidad.' })}
      <div id="propios"></div>
      <section aria-labelledby="explorar">
        <h2 id="explorar" class="mb-3 text-lg font-semibold tracking-tight">Explorar semilleros</h2>
        <form role="search" class="mb-4 flex gap-3" data-form="busqueda">
          ${field({ label: 'Buscar semilleros', name: 'q', type: 'search', placeholder: 'Nombre del semillero o facultad', className: 'grow [&>label]:sr-only' })}
          ${button({ type: 'submit', icon: 'search-line', className: 'self-end', children: 'Buscar' })}
        </form>
        <div id="explorar-lista"></div>
      </section>
      <div id="solicitudes"></div>`,
  );

  const propios = root.querySelector('#propios');
  const lista = root.querySelector('#explorar-lista');
  let misSemilleros = [];

  const cargarPropios = async () => {
    if (!esMiembro) return;
    misSemilleros = (await intentar(() => semillerosApi.listar({ mios: true }))) ?? [];
    mount(
      propios,
      misSemilleros.length
        ? html`<section aria-labelledby="mis-semilleros" class="mb-8">
            <h2 id="mis-semilleros" class="mb-3 text-lg font-semibold tracking-tight">${misSemilleros.length > 1 ? 'Mis semilleros' : 'Mi semillero'}</h2>
            <div class="space-y-3">${misSemilleros.map((s) => semilleroCard(s))}</div>
          </section>`
        : '',
    );
  };

  const cargarExplorar = () =>
    cargar(lista, () => semillerosApi.listar({ q: termino }), (filas) => {
      // Sin busqueda activa no se repiten los propios; al buscar se muestran todos los resultados.
      const visibles = termino ? filas : filas.filter((f) => !misSemilleros.some((p) => p.id === f.id));
      mount(
        lista,
        visibles.length === 0
          ? card({}, emptyState({
              icon: 'flask-line',
              title: termino ? 'No encontramos semilleros' : 'Ya perteneces a todos los semilleros disponibles',
              description: termino ? 'Prueba con otro término de búsqueda.' : undefined,
            }))
          : html`<div class="space-y-3">${visibles.map((s) => semilleroCard(s, { puedeVincularse: esEstudiante }))}</div>`,
      );
    });

  const cargarSolicitudes = async () => {
    if (!esEstudiante) return;
    const filas = (await intentar(() => vinculacionesApi.listar())) ?? [];
    mount(root.querySelector('#solicitudes'), filas.length ? solicitudes(filas) : '');
  };

  const recargar = async () => {
    await cargarPropios();
    await Promise.all([cargarExplorar(), cargarSolicitudes()]);
  };

  root.querySelector('[data-form="busqueda"]').addEventListener('submit', (event) => {
    event.preventDefault();
    termino = new FormData(event.currentTarget).get('q').trim();
    cargarExplorar();
  });

  atenderTarjetas(root, recargar);
  recargar();
}
