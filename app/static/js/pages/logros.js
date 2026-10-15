/**
 * Mis logros (RF-4.1 a RF-4.6): seguimiento de los logros propios en el flujo de validacion.
 * El encabezado y el recorrido del logro los escribe templates/logros.html.
 */
import { html, mount, card, cargar, emptyState, estadoBadge, evidenceChip } from '../core/ui.js';
import { logrosApi } from '../core/api.js';
import { formatDate } from '../core/format.js';

export default function iniciar({ root }) {
  const lista = root.querySelector('[data-region="lista"]');

  cargar(lista, () => logrosApi.listar({ mios: true }), (filas) =>
    mount(
      lista,
      filas.length === 0
        ? card({}, emptyState({ icon: 'award-line', title: 'Aún no has registrado logros', description: 'Ponencias, artículos, eventos y más suman XP a tu semillero.' }))
        : card({}, html`<ul class="divide-y divide-line/60">${filas.map(
            (l) => html`<li class="flex flex-wrap items-center gap-3 py-4">
              <div class="min-w-0 grow">
                <p class="font-medium">${l.titulo}</p>
                <p class="text-sm text-ink-soft">${l.tipo} · ${l.semillero} · ${formatDate(l.fechaRegistro)}</p>
                ${l.estado === 'rechazado' ? html`<p class="mt-1 text-sm text-danger">Motivo: ${l.motivoRechazo}</p>` : ''}
              </div>
              ${evidenceChip(l.evidencia)}
              ${l.estado === 'aprobado' ? html`<span class="text-sm font-semibold text-success">+${l.xpAsignado} XP</span>` : ''}
              ${estadoBadge(l.estado)}
            </li>`,
          )}</ul>`),
    ),
  );
}
