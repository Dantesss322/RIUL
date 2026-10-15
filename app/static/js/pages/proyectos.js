/** Proyectos de los semilleros del usuario (todos para el administrador): busqueda y filtro por estado. */
import { html, mount, button, card, cargar, emptyState, estadoBadge, field, pageHeader } from '../core/ui.js';
import { proyectosApi } from '../core/api.js';
import { ESTADOS, ESTADOS_PROYECTO, toOptions } from '../core/dominio.js';
import { plural } from '../core/format.js';

const ESTADOS_OPCIONES = toOptions(ESTADOS_PROYECTO, ESTADOS);

export default function iniciar({ root }) {
  let filtros = { q: '', estado: '' };

  mount(
    root,
    html`${pageHeader({ title: 'Proyectos', description: 'Seguimiento de los proyectos de investigación de tus semilleros.' })}
      <form role="search" class="mb-6 flex flex-wrap items-end gap-3" data-form="filtros">
        ${field({ label: 'Buscar proyectos', name: 'q', type: 'search', placeholder: 'Nombre del proyecto', className: 'grow' })}
        ${field({ label: 'Estado', name: 'estado', type: 'select', placeholder: 'Todos', options: ESTADOS_OPCIONES })}
        ${button({ type: 'submit', icon: 'search-line', children: 'Filtrar' })}
      </form>
      <div id="listado"></div>`,
  );

  const listado = root.querySelector('#listado');
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
