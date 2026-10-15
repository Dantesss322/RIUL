/**
 * Mapa de pantallas de la aplicacion (area /app).
 *
 * Es la unica fuente de verdad para:
 *  - el menu lateral (js/core/shell.js),
 *  - los permisos por rol (la pantalla a la que un rol no pertenece lo devuelve a /app),
 *  - los accesos rapidos del panel.
 *
 * path:  relativo a /app ('' = inicio; ":id" = parametro).
 * roles: roles con acceso; omitido = cualquier usuario autenticado.
 * nav:   si existe, aparece en el menu bajo `section`.
 * Debe coincidir con las rutas de app/routes/web_routes.py.
 */
const ADMIN = ['administrador'];
const LIDER = ['docente_lider'];
const MIEMBROS = ['docente_lider', 'estudiante'];

export const rutas = [
  { path: '', nav: { label: 'Inicio', icon: 'home-5-line' } },
  { path: 'perfil', nav: { label: 'Mi perfil', icon: 'user-3-line' } },

  { path: 'semilleros', nav: { section: 'Investigación', label: 'Semilleros', icon: 'team-line' } },
  { path: 'semilleros/:id' },
  { path: 'proyectos', nav: { section: 'Investigación', label: 'Proyectos', icon: 'folder-3-line' } },
  { path: 'proyectos/:id' },

  { path: 'publicaciones', nav: { section: 'Comunidad', label: 'Publicaciones', icon: 'megaphone-line' } },
  { path: 'publicaciones/nueva', roles: MIEMBROS },
  { path: 'eventos', roles: MIEMBROS, nav: { section: 'Comunidad', label: 'Eventos y convocatorias', icon: 'calendar-event-line' } },
  { path: 'notificaciones', nav: { section: 'Comunidad', label: 'Notificaciones', icon: 'notification-3-line' } },

  { path: 'logros', roles: MIEMBROS, nav: { section: 'Gamificación', label: 'Mis logros', icon: 'award-line' } },
  { path: 'logros/nuevo', roles: MIEMBROS },
  { path: 'ranking', nav: { section: 'Gamificación', label: 'Ranking e insignias', icon: 'trophy-line' } },

  { path: 'validaciones', roles: [...ADMIN, ...LIDER], nav: { section: 'Gestión', label: 'Validaciones', icon: 'shield-check-line' } },

  { path: 'admin/usuarios', roles: ADMIN, nav: { section: 'Administración', label: 'Usuarios', icon: 'group-line' } },
  { path: 'admin/academica', roles: ADMIN, nav: { section: 'Administración', label: 'Facultades y programas', icon: 'building-2-line' } },
  { path: 'admin/semilleros', roles: ADMIN, nav: { section: 'Administración', label: 'Gestión de semilleros', icon: 'flask-line' } },
  { path: 'admin/eventos', roles: ADMIN, nav: { section: 'Administración', label: 'Eventos y convocatorias', icon: 'calendar-event-line' } },
  { path: 'admin/gamificacion', roles: ADMIN, nav: { section: 'Administración', label: 'Reglas de gamificación', icon: 'medal-line' } },
  { path: 'indicadores', roles: ADMIN, nav: { section: 'Administración', label: 'Indicadores', icon: 'bar-chart-box-line' } },
];

/** Rutas con entrada de menu a las que el rol tiene acceso. */
export const rutasDeMenu = (rol) => rutas.filter((ruta) => ruta.nav && (!ruta.roles || ruta.roles.includes(rol)));

/** Entrada del mapa que corresponde a una direccion (p. ej. "/app/semilleros/3"). */
export function rutaActual(pathname) {
  const relativa = pathname.replace(/^\/app\/?/, '').replace(/\/$/, '');
  return rutas.find((ruta) => new RegExp(`^${ruta.path.replace(/:[^/]+/g, '[^/]+')}$`).test(relativa));
}
