import { http } from '../router.js';
import { reset } from '../db.js';
import { analiticaHandlers } from './analitica.js';
import { authHandlers } from './auth.js';
import { catalogosHandlers } from './catalogos.js';
import { eventosHandlers } from './eventos.js';
import { ok, open } from './helpers.js';
import { logrosHandlers } from './logros.js';
import { notificacionesHandlers } from './notificaciones.js';
import { proyectosHandlers } from './proyectos.js';
import { publicacionesHandlers } from './publicaciones.js';
import { publicoHandlers } from './publico.js';
import { semillerosHandlers } from './semilleros.js';
import { usuariosHandlers } from './usuarios.js';

/**
 * Orden de evaluación: MSW usa el primer manejador que coincide, por eso las rutas
 * específicas (p. ej. /insignias/mias, /usuarios/me) van antes que las genéricas (/:id).
 */
export const handlers = [
  ...authHandlers,
  ...publicoHandlers,
  ...usuariosHandlers,
  ...semillerosHandlers,
  ...proyectosHandlers,
  ...logrosHandlers,
  ...publicacionesHandlers,
  ...eventosHandlers,
  ...notificacionesHandlers,
  ...analiticaHandlers,
  ...catalogosHandlers,

  http.post(
    '/api/mock/reset',
    open(() => {
      reset();
      return ok(null, 'Datos de demostración restablecidos.');
    }),
  ),
];
