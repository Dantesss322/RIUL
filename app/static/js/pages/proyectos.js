/**
 * Proyectos de los semilleros del usuario (todos para el administrador): busqueda y filtro por estado.
 * El encabezado y el formulario de filtros los escribe templates/proyectos.html.
 */
import { html, mount, card, cargar, emptyState, estadoBadge } from '../core/ui.js';
import { proyectosApi } from '../core/api.js';
import { plural } from '../core/format.js';

export default function iniciar({ root }) {
  let filtros = { q: '', estado: '' };
  const listado = root.querySelector('[data-region="listado"]');

  const cargarListado = () =>
    cargar(listado, () => proyectosApi.listar(filtros), (filas) =>
      mount(
        listado,
        filas.length === 0
          ? card({}, emptyState({ icon: 'folder-3-line', title: 'No hay proyectos para mostrar', description: 'Cuando tu semillero registre proyectos aparecerán aquí.' }))
          : html`<div class="grid gap-4 md:grid-cols-2">${filas.map((p) =>
              card({}, html`<div class="flex items-start justify-between gap-3">
                  <a href="/app/proyectos/${p.id}" class="text-lg font-semibold tracking-tight hover:text-accent">${p.nombre}</a>${estadoBadge(p.estado)}
                </div>
                <p class="mt-1 text-sm text-ink-soft">${p.semillero}</p>
                <p class="mt-3 line-clamp-2 text-ink-soft">${p.descripcion}</p>
                <p class="mt-4 text-sm text-ink-soft">${plural(p.totalAvances, 'avance')} publicados</p>`),
            )}</div>`,
      ),
    );

  root.querySelector('[data-form="filtros"]').addEventListener('submit', (event) => {
    event.preventDefault();
    const datos = new FormData(event.currentTarget);
    filtros = { q: datos.get('q').trim(), estado: datos.get('estado') };
    cargarListado();
  });

  cargarListado();
}
