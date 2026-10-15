/**
 * Inicio publico (RF-8.1 a RF-8.3): accesos a Semilleros, Proyectos y Eventos y contenido destacado.
 * Solo muestra informacion aprobada y publica, sin datos personales (RNF-9).
 */
import { html, mount, badge, card, cargar, levelStars, icon, linkButton } from '../core/ui.js';
import { publicoApi } from '../core/api.js';
import { ESTADOS } from '../core/dominio.js';
import { formatDate, plural } from '../core/format.js';

const CATEGORIAS = [
  { tipo: 'semilleros', label: 'Semilleros', icono: 'flask-line', texto: 'Grupos de investigación activos en todas las facultades.' },
  { tipo: 'proyectos', label: 'Proyectos', icono: 'folder-3-line', texto: 'Proyectos abiertos a la consulta de la comunidad.' },
  { tipo: 'eventos', label: 'Eventos', icono: 'calendar-event-line', texto: 'Encuentros, talleres y simposios próximos.' },
];

export default function iniciar({ root }) {
  mount(
    root,
    html`<section class="mx-auto max-w-4xl px-4 pt-10 pb-10 text-center sm:px-6 sm:pt-14">
        <p class="text-xl font-bold tracking-tight text-accent sm:text-3xl">Red de Investigación Universidad Libre</p>
        <h1 class="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">La investigación que se ve, se comparte y se reconoce.</h1>
        <p class="mx-auto mt-5 max-w-2xl text-base text-ink-soft sm:text-lg">
          Conoce los semilleros, proyectos y eventos de la universidad. Si haces parte de la comunidad, inicia sesión
          para publicar, registrar logros y construir tu hoja de vida investigativa.
        </p>
        <div class="mt-6 flex flex-wrap justify-center gap-3">
          ${linkButton({ href: '/explorar/semilleros', size: 'lg', children: 'Explorar semilleros' })}
          ${linkButton({ href: '/registro', variant: 'secondary', size: 'lg', children: 'Solicitar acceso' })}
        </div>
      </section>
      <div id="contenido"></div>`,
  );

  cargar(
    root.querySelector('#contenido'),
    () => publicoApi.inicio(),
    (inicio) =>
      mount(
        root.querySelector('#contenido'),
        html`<div class="mx-auto max-w-6xl space-y-10 px-4 pb-14 sm:px-6">
          <section aria-label="Categorías" class="grid gap-4 sm:grid-cols-3">${CATEGORIAS.map(
            (c) => html`<a href="/explorar/${c.tipo}" class="group rounded-card border border-line/70 bg-surface p-6 shadow-card transition-transform hover:-translate-y-0.5">
              <span class="text-accent">${icon(c.icono, { size: 28 })}</span>
              <h2 class="mt-4 text-xl font-semibold tracking-tight">${c.label}</h2>
              <p class="mt-1 text-ink-soft">${c.texto}</p>
              <p class="mt-4 text-sm font-medium text-accent">${inicio.totales[c.tipo]} disponibles</p>
            </a>`,
          )}</section>

          <section aria-labelledby="destacados">
            <h2 id="destacados" class="mb-4 text-2xl font-semibold tracking-tight">Contenido público destacado</h2>
            <div class="grid gap-4 md:grid-cols-3">
              ${inicio.semilleros.map((s) =>
                card({}, html`<p class="text-sm text-ink-soft">Semillero · ${s.facultad}</p>
                  <h3 class="mt-1 font-semibold">${s.nombre}</h3>
                  <div class="mt-3 flex items-center justify-between text-sm text-ink-soft">${levelStars(s.nivel)}<span>${plural(s.totalIntegrantes, 'integrante')}</span></div>`),
              )}
              ${inicio.proyectos.map((p) =>
                card({}, html`<p class="text-sm text-ink-soft">Proyecto de investigación · ${p.semillero}</p>
                  <h3 class="mt-1 font-semibold">${p.nombre}</h3>
                  <div class="mt-3">${badge(ESTADOS[p.estado].tone, ESTADOS[p.estado].label)}</div>`),
              )}
              ${inicio.publicaciones.map((n) =>
                card({}, html`<p class="text-sm text-ink-soft">${n.semillero} · ${n.categoria} · ${formatDate(n.fecha)}</p>
                  <p class="mt-2 line-clamp-4">${n.contenido}</p>`),
              )}
            </div>
          </section>
        </div>`,
      ),
  );
}
