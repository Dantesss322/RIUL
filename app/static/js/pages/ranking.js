/**
 * Ranking e insignias (RF-4.4, RF-6.3): semilleros, investigadores e insignias con su progreso.
 * El encabezado, las pestanas y las tarjetas de insignias los escribe templates/ranking.html.
 */
import { html, mount, card, cargar, insigniaCard, levelStars } from '../core/ui.js';
import { iniciarTabs } from '../core/dom.js';
import { analiticaApi } from '../core/api.js';

const posicion = (valor) =>
  html`<span class="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${valor <= 3 ? 'bg-accent-soft text-accent' : 'bg-canvas text-ink-soft'}">${valor}</span>`;

export default function iniciar({ root }) {
  let propios = [];

  const region = (nombre) => root.querySelector(`[data-region="${nombre}"]`);
  const bloqueInsignias = root.querySelector('[data-bloque="insignias"]');

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

  const mostrarInsignias = ({ usuario, semillero }) => {
    mount(region('insignias-usuario'), usuario.map(insigniaCard));
    root.querySelector('[data-bloque="insignias-semillero"]').hidden = semillero.length === 0;
    mount(region('insignias-semillero'), semillero.map(insigniaCard));
  };

  const cargarPestana = (id) => {
    const esInsignias = id === 'insignias';
    bloqueInsignias.hidden = !esInsignias;
    region('ranking').hidden = esInsignias;

    if (esInsignias) {
      cargar(region('insignias-usuario'), () => analiticaApi.insignias(), mostrarInsignias);
    } else {
      cargar(region('ranking'), () => analiticaApi.ranking(id), (filas) => mount(region('ranking'), ranking(filas, id)));
    }
  };

  // Semilleros del usuario, para resaltar "Tu semillero" (el administrador no tiene).
  analiticaApi
    .dashboard()
    .then((d) => {
      propios = (d.semilleros ?? []).map((s) => s.id);
    })
    .catch(() => {})
    .finally(() => iniciarTabs(root, { alCambiar: cargarPestana }));
}
