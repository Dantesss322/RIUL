/**
 * Muro de publicaciones (RF-3): reacciones, comentarios, compartidos y estadisticas de impacto.
 * Las publicaciones de estudiantes aparecen como "Pendiente" para su autor hasta que el lider las apruebe.
 * El encabezado, el filtro y el formulario de comentario los escribe templates/publicaciones.html.
 */
import { html, raw, mount, avatar, badge, button, card, cargar, emptyState, estadoBadge, evidenceChip, icon, intentar, on } from '../core/ui.js';
import { plantilla } from '../core/dom.js';
import { publicacionesApi } from '../core/api.js';
import { formatRelative, plural } from '../core/format.js';
import { notify } from '../core/notify.js';

export default function iniciar({ root }) {
  let categoria = '';
  let publicaciones = [];
  const comentariosAbiertos = new Map(); // id de publicacion -> comentarios cargados
  const feed = root.querySelector('[data-region="feed"]');

  const comentarios = (id) =>
    html`<div class="mt-4 space-y-3 border-t border-line/70 pt-4" data-comentarios="${id}">
      <ul class="space-y-3">${comentariosAbiertos.get(id).map(
        (c) => html`<li class="flex gap-3">${avatar(c.autor, 'sm')}
          <div class="rounded-2xl bg-canvas px-4 py-2 text-[15px]"><p class="text-sm font-medium">${c.autor}</p><p>${c.contenido}</p></div>
        </li>`,
      )}</ul>
      ${raw(plantilla('comentario'))}
    </div>`;

  const tarjeta = (p) =>
    card({}, html`<header class="flex items-start gap-3">
        ${avatar(p.autor)}
        <div class="min-w-0 grow"><p class="font-medium">${p.autor}</p><p class="text-sm text-ink-soft">${p.semillero} · ${p.categoria} · ${formatRelative(p.fecha)}</p></div>
        ${p.estado !== 'publicada' ? estadoBadge(p.estado) : ''}
        ${p.esPublico && p.estado === 'publicada' ? badge('info', 'Pública') : ''}
      </header>
      <p class="mt-4 whitespace-pre-line">${p.contenido}</p>
      ${p.evidencia ? html`<div class="mt-3">${evidenceChip(p.evidencia)}</div>` : ''}
      ${p.estado === 'publicada'
        ? html`<footer class="mt-4 flex flex-wrap items-center gap-1 border-t border-line/70 pt-3">
              ${button({ variant: 'ghost', size: 'sm', icon: p.reaccionado ? 'heart-fill' : 'heart-line', children: p.reacciones, 'aria-pressed': String(p.reaccionado), 'data-action': 'reaccion', 'data-id': p.id })}
              ${button({ variant: 'ghost', size: 'sm', icon: 'chat-1-line', children: p.comentarios, 'data-action': 'comentarios', 'data-id': p.id })}
              ${button({ variant: 'ghost', size: 'sm', icon: 'share-forward-line', children: p.compartidos, 'data-action': 'compartir', 'data-id': p.id })}
              <span class="ml-auto flex items-center gap-1.5 text-sm text-ink-soft">${icon('pulse-line', { size: 16 })} ${plural(p.interacciones, 'interacción', 'interacciones')}</span>
            </footer>
            ${comentariosAbiertos.has(p.id) ? comentarios(p.id) : ''}`
        : ''}`);

  const dibujarFeed = () =>
    mount(
      feed,
      publicaciones.length === 0
        ? card({}, emptyState({ icon: 'megaphone-line', title: 'Aún no hay publicaciones', description: 'Sé la primera persona en compartir un avance.' }))
        : html`<div class="mx-auto max-w-3xl space-y-4">${publicaciones.map(tarjeta)}</div>`,
    );

  const recargar = () =>
    cargar(feed, () => publicacionesApi.listar({ categoria }), (filas) => {
      publicaciones = filas;
      dibujarFeed();
    });

  /** Vuelve a pedir el listado sin mostrar el indicador de carga (para no perder el scroll). */
  const refrescar = async () => {
    publicaciones = await publicacionesApi.listar({ categoria });
    dibujarFeed();
  };

  root.querySelector('select[name="categoria"]').addEventListener('change', (event) => {
    categoria = event.target.value;
    comentariosAbiertos.clear();
    recargar();
  });

  on(root, 'click', '[data-action="reaccion"]', (b) => intentar(async () => {
    await publicacionesApi.reaccionar(b.dataset.id);
    await refrescar();
  }));

  on(root, 'click', '[data-action="comentarios"]', (b) => intentar(async () => {
    const id = Number(b.dataset.id);
    if (comentariosAbiertos.has(id)) comentariosAbiertos.delete(id);
    else comentariosAbiertos.set(id, await publicacionesApi.comentarios(id));
    dibujarFeed();
  }));

  on(root, 'click', '[data-action="compartir"]', (b) => intentar(async () => {
    await publicacionesApi.compartir(b.dataset.id);
    let copiado = true;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/app/publicaciones`);
    } catch {
      copiado = false;
    }
    notify.info(copiado ? 'Enlace copiado al portapapeles' : 'Publicación compartida');
    await refrescar();
  }));

  root.addEventListener('submit', (event) => {
    const formulario = event.target.closest('[data-form="comentario"]');
    if (!formulario) return;
    event.preventDefault();
    const id = Number(formulario.closest('[data-comentarios]').dataset.comentarios);
    intentar(async () => {
      await publicacionesApi.comentar(id, new FormData(formulario).get('contenido'));
      comentariosAbiertos.set(id, await publicacionesApi.comentarios(id));
      await refrescar();
    });
  });

  recargar();
}
