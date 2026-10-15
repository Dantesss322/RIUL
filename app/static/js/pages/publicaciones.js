/**
 * Muro de publicaciones (RF-3): reacciones, comentarios, compartidos y estadisticas de impacto.
 * Las publicaciones de estudiantes aparecen como "Pendiente" para su autor hasta que el lider las apruebe.
 */
import {
  html, mount, avatar, badge, button, card, cargar, emptyState, estadoBadge, evidenceChip, field,
  icon, intentar, linkButton, on, pageHeader,
} from '../core/ui.js';
import { publicacionesApi } from '../core/api.js';
import { CATEGORIAS_PUBLICACION, toOptions } from '../core/dominio.js';
import { formatRelative, plural } from '../core/format.js';
import { notify } from '../core/notify.js';

const CATEGORIAS = toOptions(CATEGORIAS_PUBLICACION);

export default function iniciar({ root, user }) {
  let categoria = '';
  let publicaciones = [];
  const comentariosAbiertos = new Map(); // id de publicacion -> comentarios cargados

  const comentarios = (id) =>
    html`<div class="mt-4 space-y-3 border-t border-line/70 pt-4">
      <ul class="space-y-3">${comentariosAbiertos.get(id).map(
        (c) => html`<li class="flex gap-3">${avatar(c.autor, 'sm')}
          <div class="rounded-2xl bg-canvas px-4 py-2 text-[15px]"><p class="text-sm font-medium">${c.autor}</p><p>${c.contenido}</p></div>
        </li>`,
      )}</ul>
      <form class="flex items-end gap-2" data-form="comentario" data-id="${id}">
        ${field({ label: 'Escribe un comentario', name: 'contenido', placeholder: 'Escribe un comentario', className: 'grow [&>label]:sr-only', required: true })}
        ${button({ type: 'submit', icon: 'send-plane-line', 'aria-label': 'Enviar comentario' })}
      </form>
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
              ${button({ variant: 'ghost', size: 'sm', icon: p.reaccionado ? 'heart-fill' : 'heart-line', children: p.reacciones, 'aria-pressed': p.reaccionado, 'data-action': 'reaccion', 'data-id': p.id })}
              ${button({ variant: 'ghost', size: 'sm', icon: 'chat-1-line', children: p.comentarios, 'data-action': 'comentarios', 'data-id': p.id })}
              ${button({ variant: 'ghost', size: 'sm', icon: 'share-forward-line', children: p.compartidos, 'data-action': 'compartir', 'data-id': p.id })}
              <span class="ml-auto flex items-center gap-1.5 text-sm text-ink-soft">${icon('pulse-line', { size: 16 })} ${plural(p.interacciones, 'interacción', 'interacciones')}</span>
            </footer>
            ${comentariosAbiertos.has(p.id) ? comentarios(p.id) : ''}`
        : ''}`);

  mount(
    root,
    html`${pageHeader({
        title: 'Publicaciones',
        description: 'Lo que está compartiendo la comunidad investigativa.',
        actions: user.rol !== 'administrador'
          ? linkButton({ href: '/app/publicaciones/nueva', icon: 'add-line', children: 'Publicar' })
          : '',
      })}
      <div class="mb-6 max-w-xs">${field({ label: 'Categoría', name: 'categoria', type: 'select', placeholder: 'Todas las categorías', options: CATEGORIAS })}</div>
      <div id="feed"></div>`,
  );

  const feed = root.querySelector('#feed');
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
    const id = Number(formulario.dataset.id);
    intentar(async () => {
      await publicacionesApi.comentar(id, new FormData(formulario).get('contenido'));
      comentariosAbiertos.set(id, await publicacionesApi.comentarios(id));
      await refrescar();
    });
  });

  recargar();
}
