/**
 * Tarjeta de semillero con sus acciones de estudiante: seguir y solicitar vinculacion (RF-2.6).
 * Las acciones llevan data-action; la pagina que la dibuja las atiende con `atenderTarjetas`.
 */
import { html, badge, button, card, estadoBadge, levelStars, on, intentar, withLoading } from '../core/ui.js';
import { semillerosApi, vinculacionesApi } from '../core/api.js';
import { plural } from '../core/format.js';

export function semilleroCard(semillero, { puedeVincularse = false } = {}) {
  const { id, nombre, facultad, docenteLider, progreso, totalIntegrantes, siguiendo, vinculacion, esLider } = semillero;
  const puedeSolicitar = puedeVincularse && (!vinculacion || vinculacion.estado === 'rechazado');

  return card(
    {},
    html`<div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <a href="/app/semilleros/${id}" class="text-lg font-semibold tracking-tight hover:text-accent">${nombre}</a>
          <p class="text-sm text-ink-soft">${facultad} · Líder: ${docenteLider}</p>
        </div>
        <div class="flex items-center gap-3 text-sm text-ink-soft">${levelStars(progreso.nivel)}<span>${plural(totalIntegrantes, 'integrante')}</span></div>
      </div>
      <div class="mt-4 flex flex-wrap items-center gap-2">
        ${esLider ? badge('info', 'Lideras este semillero') : ''}
        ${vinculacion?.estado === 'activo' ? badge('success', 'Eres integrante') : ''}
        ${vinculacion?.estado === 'pendiente' || vinculacion?.estado === 'rechazado' ? estadoBadge(vinculacion.estado) : ''}
        <span class="grow"></span>
        ${button({
          variant: 'ghost',
          size: 'sm',
          icon: siguiendo ? 'bookmark-fill' : 'bookmark-line',
          children: siguiendo ? 'Siguiendo' : 'Seguir',
          'data-action': 'seguir',
          'data-id': id,
          'data-siguiendo': siguiendo,
        })}
        ${puedeSolicitar ? button({ size: 'sm', icon: 'user-add-line', children: 'Solicitar vinculación', 'data-action': 'vincular', 'data-id': id }) : ''}
      </div>`,
  );
}

/** Atiende "Seguir" y "Solicitar vinculacion" en cualquier contenedor con tarjetas. `recargar` redibuja. */
export function atenderTarjetas(root, recargar) {
  on(root, 'click', '[data-action="seguir"]', (boton) =>
    withLoading(boton, () =>
      intentar(async () => {
        const { id, siguiendo } = boton.dataset;
        await (siguiendo === 'true' ? semillerosApi.dejarDeSeguir(id) : semillerosApi.seguir(id));
        await recargar();
      }),
    ),
  );

  on(root, 'click', '[data-action="vincular"]', (boton) =>
    withLoading(boton, () =>
      intentar(async () => {
        await vinculacionesApi.solicitar(boton.dataset.id);
        await recargar();
      }),
    ),
  );
}
