/**
 * Inicio publico (RF-8.1 a RF-8.3): accesos a Semilleros, Proyectos y Eventos y contenido destacado.
 * Solo muestra informacion aprobada y publica, sin datos personales (RNF-9).
 * El marco (texto, accesos y contenedores) lo escribe templates/landing.html; aqui llegan los datos.
 */
import { html, mount, badge, card, cargarMarco, levelStars } from '../core/ui.js';
import { enlazar } from '../core/dom.js';
import { publicoApi } from '../core/api.js';
import { ESTADOS } from '../core/dominio.js';
import { formatDate, plural } from '../core/format.js';

export default function iniciar({ root }) {
  cargarMarco(root.querySelector('[data-carga]'), () => publicoApi.inicio(), (inicio) => {
    enlazar(root, inicio);

    mount(root.querySelector('[data-region="destacados"]'), [
      ...inicio.semilleros.map((s) =>
        card({}, html`<p class="text-sm text-ink-soft">Semillero · ${s.facultad}</p>
          <h3 class="mt-1 font-semibold">${s.nombre}</h3>
          <div class="mt-3 flex items-center justify-between text-sm text-ink-soft">${levelStars(s.nivel)}<span>${plural(s.totalIntegrantes, 'integrante')}</span></div>`),
      ),
      ...inicio.proyectos.map((p) =>
        card({}, html`<p class="text-sm text-ink-soft">Proyecto de investigación · ${p.semillero}</p>
          <h3 class="mt-1 font-semibold">${p.nombre}</h3>
          <div class="mt-3">${badge(ESTADOS[p.estado].tone, ESTADOS[p.estado].label)}</div>`),
      ),
      ...inicio.publicaciones.map((n) =>
        card({}, html`<p class="text-sm text-ink-soft">${n.semillero} · ${n.categoria} · ${formatDate(n.fecha)}</p>
          <p class="mt-2 line-clamp-4">${n.contenido}</p>`),
      ),
    ]);
  });
}
