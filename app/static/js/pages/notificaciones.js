/** Notificaciones (RF-3.2): cada usuario ve las generadas por su rol y su actividad. */
import { html, mount, button, card, cargar, emptyState, intentar, on, pageHeader } from '../core/ui.js';
import { notificacionesApi } from '../core/api.js';
import { formatRelative } from '../core/format.js';

export default function iniciar({ root }) {
  mount(
    root,
    html`${pageHeader({
        title: 'Notificaciones',
        description: 'Novedades de tus semilleros, validaciones y convocatorias.',
        actions: button({ variant: 'secondary', icon: 'check-double-line', children: 'Marcar todas como leídas', 'data-action': 'todas' }),
      })}
      <div id="lista"></div>`,
  );

  const lista = root.querySelector('#lista');
  const recargar = () =>
    cargar(lista, () => notificacionesApi.listar(), (filas) =>
      mount(
        lista,
        filas.length === 0
          ? card({}, emptyState({ icon: 'notification-3-line', title: 'No tienes notificaciones', description: 'Te avisaremos cuando haya novedades.' }))
          : html`<section class="rounded-card border border-line/70 bg-surface p-2 shadow-card"><ul>${filas.map(
              (n) => html`<li><button type="button" data-abrir="${n.id}" data-ruta="${n.ruta}" data-leida="${n.leida}" class="flex w-full items-start gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors hover:bg-canvas">
                <span aria-hidden="true" class="mt-2 size-2.5 shrink-0 rounded-full ${n.leida ? 'bg-transparent' : 'bg-accent'}"></span>
                <span class="min-w-0">
                  <span class="block ${n.leida ? 'text-ink-soft' : 'font-medium'}">${n.mensaje}</span>
                  <span class="block text-sm text-ink-soft">${formatRelative(n.fecha)}</span>
                </span>
              </button></li>`,
            )}</ul></section>`,
      ),
    );

  on(root, 'click', '[data-abrir]', async (boton) => {
    if (boton.dataset.leida === 'false') await intentar(() => notificacionesApi.marcarLeida(boton.dataset.abrir));
    window.location.assign(boton.dataset.ruta);
  });

  on(root, 'click', '[data-action="todas"]', () =>
    intentar(async () => {
      await notificacionesApi.marcarTodasLeidas();
      await recargar();
    }),
  );

  recargar();
}
