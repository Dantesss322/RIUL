/**
 * Panel de inicio (RF-6.1): resumen segun el rol en una sola peticion.
 * Administrador: pendientes y totales. Docente lider y estudiante: nivel del semillero, XP,
 * insignias, pendientes y actividad reciente.
 * El marco (tarjetas, contadores y textos) lo escribe templates/dashboard.html; los bloques propios de
 * cada rol llevan data-roles. Aqui se escriben los numeros y las listas.
 */
import { html, mount, cargarMarco, insigniaIcon, levelStars, xpProgress, icon } from '../core/ui.js';
import { enlazar } from '../core/dom.js';
import { analiticaApi } from '../core/api.js';
import { rutasDeMenu } from '../core/routes.js';
import { ROLES } from '../core/dominio.js';
import { formatRelative } from '../core/format.js';

const region = (root, nombre) => root.querySelector(`[data-region="${nombre}"]`);

function vistaAdministrador(root, { ranking }) {
  mount(
    region(root, 'ranking'),
    ranking.map(
      (s) => html`<li class="flex items-center justify-between gap-3 py-3">
        <span class="font-medium">${s.posicion}. ${s.nombre}</span>
        <span class="flex items-center gap-3 text-sm text-ink-soft">${levelStars(s.nivel)} ${s.xp} XP</span>
      </li>`,
    ),
  );
}

function vistaMiembro(root, { semilleros, insignias, actividad }) {
  mount(
    region(root, 'semilleros'),
    semilleros.length === 0
      ? html`<p class="text-ink-soft">Aún no perteneces a un semillero. Explora y solicita vinculación.</p>`
      : html`<ul class="space-y-5">${semilleros.map(
          (s) => html`<li>
            <div class="mb-2 flex items-center justify-between gap-3">
              <a href="/app/semilleros/${s.id}" class="font-medium hover:text-accent">${s.nombre}</a>${levelStars(s.progreso.nivel)}
            </div>
            ${xpProgress(s.progreso)}
          </li>`,
        )}</ul>`,
  );

  mount(
    region(root, 'insignias'),
    insignias.length === 0
      ? html`<p class="text-ink-soft">Registra y valida tus logros para desbloquear insignias.</p>`
      : html`<ul class="flex flex-wrap gap-3">${insignias.map(
          (i) => html`<li class="flex items-center gap-2 rounded-full bg-accent-soft py-1.5 pr-4 pl-3 text-sm font-medium text-accent">${insigniaIcon(i.icono, 18)}${i.nombre}</li>`,
        )}</ul>`,
  );

  mount(
    region(root, 'actividad'),
    actividad.length === 0
      ? html`<p class="text-ink-soft">Todavía no hay movimientos en tus semilleros.</p>`
      : html`<ul class="space-y-3">${actividad.map(
          (a) => html`<li class="text-[15px]">${a.texto}<span class="block text-sm text-ink-soft">${formatRelative(a.fecha)}</span></li>`,
        )}</ul>`,
  );
}

export default function iniciar({ root, user }) {
  const accesos = rutasDeMenu(user.rol).filter((ruta) => ruta.path !== '').slice(0, 5);
  mount(
    region(root, 'accesos'),
    accesos.map(
      (ruta) => html`<a href="/app/${ruta.path}" class="card flex flex-col items-start gap-3 rounded-2xl p-4 transition-transform hover:-translate-y-0.5">
        <span class="text-accent">${icon(ruta.nav.icon, { size: 22 })}</span>
        <span class="text-sm leading-tight font-medium">${ruta.nav.label}</span>
      </a>`,
    ),
  );

  enlazar(root, { saludo: `Hola, ${user.nombre.split(' ')[0]}`, rolEtiqueta: ROLES[user.rol] });

  cargarMarco(root.querySelector('[data-carga]'), () => analiticaApi.dashboard(), (datos) => {
    if (user.rol === 'administrador') {
      enlazar(root, datos);
      vistaAdministrador(root, datos);
      return;
    }

    const principal = datos.semilleros[0];
    enlazar(root, {
      ...datos,
      xp: user.rol === 'docente_lider' ? (principal?.progreso.xp ?? 0) : datos.xpAportado,
      posicion: principal ? `#${principal.posicion}` : '—',
      posicionDetalle: principal ? `de ${principal.totalSemilleros} semilleros` : 'Aún sin semillero',
      totalInsignias: datos.insignias.length,
      tituloSemilleros: datos.semilleros.length > 1 ? 'Mis semilleros' : 'Mi semillero',
    });
    vistaMiembro(root, datos);
  });
}
