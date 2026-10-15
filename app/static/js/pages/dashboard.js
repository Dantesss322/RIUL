/**
 * Panel de inicio (RF-6.1): resumen segun el rol en una sola peticion.
 * Administrador: pendientes y totales. Docente lider y estudiante: nivel del semillero, XP,
 * insignias, pendientes y actividad reciente.
 */
import { html, mount, card, cargar, insigniaIcon, levelStars, pageHeader, stat, xpProgress, icon } from '../core/ui.js';
import { analiticaApi } from '../core/api.js';
import { rutasDeMenu } from '../core/routes.js';
import { ROLES } from '../core/dominio.js';
import { formatRelative } from '../core/format.js';

/** Contador con enlace al modulo donde se atiende. */
const pendiente = (href, etiqueta, valor) =>
  html`<a href="${href}" class="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-canvas">
    <span>${etiqueta}</span>
    <span class="min-w-7 rounded-full px-2 py-0.5 text-center text-sm font-semibold ${valor ? 'bg-accent text-white' : 'bg-canvas text-ink-soft'}">${valor}</span>
  </a>`;

function vistaAdministrador({ pendientes, totales, ranking }) {
  return html`<div class="space-y-6">
    ${card({ title: 'Requiere tu atención' }, html`
      ${pendiente('/app/admin/usuarios', 'Cuentas por aprobar', pendientes.cuentas)}
      ${pendiente('/app/validaciones', 'Logros en validación', pendientes.logros)}
      ${pendiente('/app/validaciones', 'Postulaciones por resolver', pendientes.postulaciones)}`)}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      ${stat({ label: 'Usuarios activos', value: totales.usuarios })}
      ${stat({ label: 'Semilleros', value: totales.semilleros })}
      ${stat({ label: 'Publicaciones', value: totales.publicaciones })}
      ${stat({ label: 'Logros aprobados', value: totales.logrosAprobados })}
    </div>
    ${card({ title: 'Semilleros líderes del ranking' }, html`<ol class="divide-y divide-line/60">${ranking.map(
      (s) => html`<li class="flex items-center justify-between gap-3 py-3">
        <span class="font-medium">${s.posicion}. ${s.nombre}</span>
        <span class="flex items-center gap-3 text-sm text-ink-soft">${levelStars(s.nivel)} ${s.xp} XP</span>
      </li>`,
    )}</ol>`)}
  </div>`;
}

function vistaMiembro({ semilleros, xpAportado, insignias, pendientes, actividad }, rol) {
  const esLider = rol === 'docente_lider';
  const principal = semilleros[0];

  return html`<div class="space-y-6">
    <div class="grid gap-4 sm:grid-cols-3">
      ${stat({ label: esLider ? 'XP del semillero' : 'XP que aportas', value: esLider ? (principal?.progreso.xp ?? 0) : xpAportado })}
      ${stat({
        label: 'Posición en el ranking',
        value: principal ? `#${principal.posicion}` : '—',
        hint: principal ? `de ${principal.totalSemilleros} semilleros` : 'Aún sin semillero',
      })}
      ${stat({ label: 'Insignias obtenidas', value: insignias.length })}
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      ${card({ title: semilleros.length > 1 ? 'Mis semilleros' : 'Mi semillero' },
        semilleros.length === 0
          ? html`<p class="text-ink-soft">Aún no perteneces a un semillero. Explora y solicita vinculación.</p>`
          : html`<ul class="space-y-5">${semilleros.map(
              (s) => html`<li>
                <div class="mb-2 flex items-center justify-between gap-3">
                  <a href="/app/semilleros/${s.id}" class="font-medium hover:text-accent">${s.nombre}</a>${levelStars(s.progreso.nivel)}
                </div>
                ${xpProgress(s.progreso)}
              </li>`,
            )}</ul>`)}

      ${card({ title: 'Pendientes' },
        esLider
          ? html`${pendiente('/app/validaciones', 'Solicitudes de vinculación', pendientes.vinculaciones)}
              ${pendiente('/app/validaciones', 'Publicaciones por aprobar', pendientes.publicaciones)}
              ${pendiente('/app/validaciones', 'Logros por enviar a validación', pendientes.logros)}`
          : html`${pendiente('/app/logros', 'Logros en revisión', pendientes.logros)}
              ${pendiente('/app/semilleros', 'Solicitudes de vinculación', pendientes.solicitudes)}`)}

      ${card({ title: 'Insignias' },
        insignias.length === 0
          ? html`<p class="text-ink-soft">Registra y valida tus logros para desbloquear insignias.</p>`
          : html`<ul class="flex flex-wrap gap-3">${insignias.map(
              (i) => html`<li class="flex items-center gap-2 rounded-full bg-accent-soft py-1.5 pr-4 pl-3 text-sm font-medium text-accent">${insigniaIcon(i.icono, 18)}${i.nombre}</li>`,
            )}</ul>`)}

      ${card({ title: 'Actividad reciente' },
        actividad.length === 0
          ? html`<p class="text-ink-soft">Todavía no hay movimientos en tus semilleros.</p>`
          : html`<ul class="space-y-3">${actividad.map(
              (a) => html`<li class="text-[15px]">${a.texto}<span class="block text-sm text-ink-soft">${formatRelative(a.fecha)}</span></li>`,
            )}</ul>`)}
    </div>
  </div>`;
}

export default function iniciar({ root, user }) {
  const accesos = rutasDeMenu(user.rol).filter((ruta) => ruta.path !== '').slice(0, 5);

  mount(
    root,
    html`${pageHeader({ title: `Hola, ${user.nombre.split(' ')[0]}`, description: ROLES[user.rol] })}
      <nav aria-label="Accesos rápidos" class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">${accesos.map(
        (ruta) => html`<a href="/app/${ruta.path}" class="flex flex-col items-start gap-3 rounded-2xl border border-line/70 bg-surface p-4 shadow-card transition-transform hover:-translate-y-0.5">
          <span class="text-accent">${icon(ruta.nav.icon, { size: 22 })}</span>
          <span class="text-sm leading-tight font-medium">${ruta.nav.label}</span>
        </a>`,
      )}</nav>
      <div id="resumen"></div>`,
  );

  const resumen = root.querySelector('#resumen');
  cargar(resumen, () => analiticaApi.dashboard(), (datos) =>
    mount(resumen, datos.rol === 'administrador' ? vistaAdministrador(datos) : vistaMiembro(datos, user.rol)),
  );
}
