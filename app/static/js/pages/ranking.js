/** Ranking e insignias (RF-4.4, RF-6.3): semilleros, investigadores e insignias con su progreso. */
import { html, mount, card, cargar, insigniaCard, levelStars, on, pageHeader, tabs } from '../core/ui.js';
import { analiticaApi } from '../core/api.js';

const posicion = (valor) =>
  html`<span class="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${valor <= 3 ? 'bg-accent-soft text-accent' : 'bg-canvas text-ink-soft'}">${valor}</span>`;

export default function iniciar({ root }) {
  let pestana = 'semilleros';
  let propios = [];

  const ranking = (filas, tipo) =>
    card({}, filas.length === 0
      ? html`<p class="text-ink-soft">Aún no hay posiciones para mostrar.</p>`
      : html`<ol class="divide-y divide-line/60">${filas.map(
          (f) => html`<li class="flex items-center gap-4 py-3.5">
            ${posicion(f.posicion)}
            <div class="min-w-0 grow">
              <p class="font-medium">${f.nombre}${propios.includes(f.id) && tipo === 'semilleros' ? html`<span class="ml-2 text-sm font-normal text-accent">Tu semillero</span>` : ''}</p>
              <p class="text-sm text-ink-soft">${tipo === 'semilleros' ? f.facultad : f.semillero}</p>
            </div>
            ${tipo === 'semilleros' ? levelStars(f.nivel) : ''}
            <span class="w-20 text-right font-semibold tabular-nums">${f.xp} XP</span>
          </li>`,
        )}</ol>`);

  const insignias = ({ usuario, semillero }) =>
    html`<div class="grid gap-6 lg:grid-cols-2">
      ${card({ title: 'Tus insignias' }, html`<ul class="space-y-3">${usuario.map(insigniaCard)}</ul>`)}
      ${semillero.length ? card({ title: 'Insignias de tu semillero' }, html`<ul class="space-y-3">${semillero.map(insigniaCard)}</ul>`) : ''}
    </div>`;

  const dibujar = () => {
    mount(
      root,
      html`${pageHeader({ title: 'Ranking e insignias', description: 'El reconocimiento a la actividad investigativa, actualizado al aprobar cada logro.' })}
        <div class="mb-4">${tabs([{ id: 'semilleros', label: 'Semilleros' }, { id: 'investigadores', label: 'Investigadores' }, { id: 'insignias', label: 'Insignias' }], pestana)}</div>
        <div id="contenido"></div>`,
    );
    const contenido = root.querySelector('#contenido');
    if (pestana === 'insignias') cargar(contenido, () => analiticaApi.insignias(), (d) => mount(contenido, insignias(d)));
    else cargar(contenido, () => analiticaApi.ranking(pestana), (filas) => mount(contenido, ranking(filas, pestana)));
  };

  on(root, 'click', '[data-tab]', (tab) => {
    pestana = tab.dataset.tab;
    dibujar();
  });

  // Semilleros del usuario, para resaltar "Tu semillero" (el administrador no tiene).
  analiticaApi
    .dashboard()
    .then((d) => {
      propios = (d.semilleros ?? []).map((s) => s.id);
    })
    .catch(() => {})
    .finally(dibujar);
}
