/**
 * Marco de la aplicacion autenticada (area /app): valida la sesion y el rol, arma el menu lateral,
 * la tarjeta del usuario, la campana de notificaciones y el cajon movil.
 * La estructura HTML (sidebar y topbar) la entregan las plantillas partials/_sidebar.html y _topbar.html.
 */
import { html, mount, on } from './html.js';
import { notificacionesApi, mockApi } from './api.js';
import { usarSimulacion } from './http.js';
import { notify } from './notify.js';
import { session } from './session.js';
import { rutaActual, rutasDeMenu } from './routes.js';
import { avatar, icon } from './ui.js';
import { ROLES } from './dominio.js';

const INTERVALO_NOTIFICACIONES_MS = 30_000;

function dibujarMenu(user) {
  const secciones = Object.groupBy(rutasDeMenu(user.rol), (ruta) => ruta.nav.section ?? '');
  const actual = location.pathname.replace(/\/$/, '');

  mount(
    document.getElementById('menu'),
    Object.entries(secciones).map(
      ([seccion, rutas]) => html`<div>
        ${seccion ? html`<p class="mb-1 px-3 text-xs font-medium tracking-wider text-sidebar-soft/80 uppercase">${seccion}</p>` : ''}
        <ul class="space-y-0.5">${rutas.map((ruta) => {
          const href = `/app${ruta.path ? `/${ruta.path}` : ''}`;
          const activa = ruta.path === '' ? actual === '/app' : actual === href || actual.startsWith(`${href}/`);
          return html`<li><a href="${href}" ${activa ? html`aria-current="page"` : ''} class="flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] font-medium transition-colors ${
            activa ? 'bg-sidebar-active text-white' : 'text-sidebar-soft hover:bg-sidebar-hover hover:text-white'
          }">${icon(ruta.nav.icon, { size: 20 })}${ruta.nav.label}</a></li>`;
        })}</ul>
      </div>`,
    ),
  );
}

function dibujarUsuario(user) {
  mount(
    document.getElementById('user-card'),
    html`<div class="flex items-center gap-3 px-3 py-2">${avatar(user.nombre, 'sm')}<div class="min-w-0">
      <p class="truncate text-sm font-medium">${user.nombre}</p>
      <p class="truncate text-xs text-sidebar-soft">${ROLES[user.rol]}</p>
    </div></div>`,
  );
}

function cerrarSesion() {
  session.clear();
  window.location.assign('/login');
}

/** Campana con el conteo de no leidas: se actualiza cada 30 s (RF-3.2). */
function iniciarCampana() {
  const contador = document.getElementById('bell-count');
  const campana = document.getElementById('bell');

  const actualizar = async () => {
    try {
      const { noLeidas } = await notificacionesApi.conteo();
      contador.textContent = noLeidas;
      contador.hidden = noLeidas === 0;
      campana.setAttribute('aria-label', noLeidas ? `Notificaciones, ${noLeidas} sin leer` : 'Notificaciones');
    } catch {
      // Consulta en segundo plano: un fallo puntual no debe interrumpir.
    }
  };

  actualizar();
  setInterval(actualizar, INTERVALO_NOTIFICACIONES_MS);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && actualizar());
}

function iniciarCajonMovil() {
  const menu = document.getElementById('sidebar');
  const fondo = document.getElementById('overlay');
  const alternar = (abrir) => {
    menu.classList.toggle('-translate-x-full', !abrir);
    fondo.hidden = !abrir;
  };
  on(document, 'click', '#btn-menu', () => alternar(menu.classList.contains('-translate-x-full')));
  fondo.addEventListener('click', () => alternar(false));
}

/**
 * Prepara el marco. Devuelve el usuario, o null si redirige (sin sesion o sin permiso para la pantalla).
 */
export function iniciarShell() {
  const user = session.user();
  if (!user) {
    window.location.replace('/login');
    return null;
  }

  const ruta = rutaActual(location.pathname);
  if (ruta?.roles && !ruta.roles.includes(user.rol)) {
    window.location.replace('/app');
    return null;
  }

  dibujarMenu(user);
  dibujarUsuario(user);
  iniciarCampana();
  iniciarCajonMovil();

  document.getElementById('btn-logout').addEventListener('click', cerrarSesion);

  const reset = document.getElementById('btn-reset');
  reset.hidden = !usarSimulacion;
  reset.addEventListener('click', async () => {
    const acepta = await notify.confirm({
      title: 'Restablecer datos de demostración',
      text: 'Se perderán los cambios hechos durante la demostración y se cerrará la sesión.',
      confirmText: 'Restablecer',
    });
    if (!acepta) return;
    await mockApi.restablecer();
    cerrarSesion();
  });

  return user;
}
