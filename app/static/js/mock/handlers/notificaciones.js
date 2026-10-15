import { http } from '../router.js';
import { byId } from '../domain.js';
import { notFound, ok, secured } from './helpers.js';

/** RF-3.2: cada usuario ve únicamente sus propias notificaciones. */
export const notificacionesHandlers = [
  http.get(
    '/api/notificaciones',
    secured(({ state, user }) =>
      ok(state.notificaciones.filter((n) => n.idUsuario === user.id).sort((a, b) => b.fecha.localeCompare(a.fecha))),
    ),
  ),

  http.get(
    '/api/notificaciones/conteo',
    secured(({ state, user }) => ok({ noLeidas: state.notificaciones.filter((n) => n.idUsuario === user.id && !n.leida).length })),
  ),

  http.patch(
    '/api/notificaciones/leidas',
    secured(({ state, user }) => {
      state.notificaciones.filter((n) => n.idUsuario === user.id).forEach((n) => (n.leida = true));
      return ok(null);
    }),
  ),

  http.patch(
    '/api/notificaciones/:id/leida',
    secured(({ params, state, user }) => {
      const notificacion = byId(state.notificaciones, Number(params.id));
      if (!notificacion || notificacion.idUsuario !== user.id) return notFound('La notificación');
      notificacion.leida = true;
      return ok(null);
    }),
  ),
];
