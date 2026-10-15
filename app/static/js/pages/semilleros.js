/**
 * Semilleros (RF-2.6): pantalla unica. Arriba, los semilleros propios; debajo, la exploracion con
 * busqueda para consultar informacion y solicitar vinculacion.
 * El marco (secciones, buscador y contenedores) lo escribe templates/semilleros.html.
 */
import { html, mount, card, cargar, emptyState, estadoBadge, intentar } from '../core/ui.js';
import { enlazar } from '../core/dom.js';
import { semillerosApi, vinculacionesApi } from '../core/api.js';
import { atenderTarjetas, semilleroCard } from '../components/semillero_card.js';

export default function iniciar({ root, user }) {
  let termino = '';
  const esMiembro = user.rol !== 'administrador';
  const esEstudiante = user.rol === 'estudiante';

  const bloquePropios = root.querySelector('[data-bloque="propios"]');
  const propios = root.querySelector('[data-region="propios"]');
  const lista = root.querySelector('[data-region="explorar"]');
  let misSemilleros = [];

  const cargarPropios = async () => {
    if (!esMiembro) return;
    misSemilleros = (await intentar(() => semillerosApi.listar({ mios: true }))) ?? [];
    bloquePropios.hidden = misSemilleros.length === 0;
    enlazar(root, { tituloPropios: misSemilleros.length > 1 ? 'Mis semilleros' : 'Mi semillero' });
    mount(propios, misSemilleros.map((s) => semilleroCard(s)));
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
    root.querySelector('[data-bloque="solicitudes"]').hidden = filas.length === 0;
    mount(
      root.querySelector('[data-region="solicitudes"]'),
      filas.map(
        (s) => html`<li class="flex items-center justify-between gap-3 py-3">
          <span class="font-medium">${s.semillero}</span>
          ${s.estado === 'pendiente'
            ? html`<span class="badge badge-warning">Pendiente · aprobación del líder</span>`
            : estadoBadge(s.estado)}
        </li>`,
      ),
    );
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
