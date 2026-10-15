/** Mis logros (RF-4.1 a RF-4.6): seguimiento de los logros propios en el flujo de validacion. */
import { html, mount, card, cargar, emptyState, estadoBadge, evidenceChip, icon, linkButton, pageHeader } from '../core/ui.js';
import { logrosApi } from '../core/api.js';
import { formatDate } from '../core/format.js';

const PIPELINE = ['Registrado', 'En validación', 'Aprobado', 'XP', 'Insignia', 'Nivel'];

export default function iniciar({ root }) {
  mount(
    root,
    html`${pageHeader({
        title: 'Mis logros',
        description: 'Registra tu actividad investigativa y sigue su validación.',
        actions: linkButton({ href: '/app/logros/nuevo', icon: 'add-line', children: 'Registrar logro' }),
      })}
      <ol aria-label="Flujo de un logro" class="mb-6 flex flex-wrap items-center gap-1 text-sm text-ink-soft">${PIPELINE.map(
        (paso, i) => html`<li class="flex items-center gap-1"><span class="rounded-full bg-black/5 px-3 py-1">${paso}</span>${
          i < PIPELINE.length - 1 ? icon('arrow-right-s-line', { size: 16 }) : ''
        }</li>`,
      )}</ol>
      <div id="lista"></div>`,
  );

  const lista = root.querySelector('#lista');
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
