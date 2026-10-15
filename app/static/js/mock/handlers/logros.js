import { http } from '../router.js';
import {
  byId,
  esLiderDe,
  esMiembroActivo,
  idsPorRol,
  insert,
  nameOf,
  notificar,
  now,
  otorgarInsignias,
  progresoDeSemillero,
  semillerosDe,
  vistaLogro,
} from '../domain.js';
import { crud, fail, missingFields, notFound, ok, readBody, secured, toNumbers } from './helpers.js';

const ADMIN = ['administrador'];
const MIEMBROS = ['docente_lider', 'estudiante'];

/**
 * Flujo de un logro (RF-4.1 a RF-4.5):
 *   registrado --(líder envía)--> en_validacion --(administrador aprueba)--> aprobado
 * El líder puede devolver un logro "registrado"; el administrador puede rechazar uno "en_validacion".
 * El XP se congela en xpAsignado al aprobar y se acumula en el semillero.
 */
const tiposLogro = crud('tipos-logro', {
  collection: 'tiposLogro',
  required: ['nombre', 'xp'],
  numeric: ['xp'],
  dependents: [['logros', 'idTipoLogro', 'logros']],
});

export const logrosHandlers = [
  http.get('/api/tipos-logro', secured(({ state }) => ok(state.tiposLogro))),
  tiposLogro.create,
  tiposLogro.update,
  tiposLogro.remove,

  http.get(
    '/api/logros',
    secured(({ request, state, user }) => {
      const params = new URL(request.url).searchParams;
      const propios = semillerosDe(state, user);

      const rows = state.logros
        .filter((l) => (user.rol === 'estudiante' ? l.idUsuario === user.id : propios.includes(l.idSemillero)))
        .filter((l) => params.get('mios') !== 'true' || l.idUsuario === user.id)
        .filter((l) => !params.get('estado') || l.estado === params.get('estado'))
        .sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro))
        .map((l) => vistaLogro(state, l));
      return ok(rows);
    }),
  ),

  http.post(
    '/api/logros',
    secured(async ({ request, state, user }) => {
      const body = toNumbers(await readBody(request), ['idTipoLogro', 'idSemillero', 'idProyecto']);
      const invalid = missingFields(body, ['idTipoLogro', 'idSemillero', 'titulo', 'evidencia']);
      if (invalid) return invalid;

      const esLider = esLiderDe(state, user, body.idSemillero);
      if (!esLider && !esMiembroActivo(state, user.id, body.idSemillero)) {
        return fail('Solo los integrantes del semillero pueden registrar logros.', 403);
      }

      // El líder es la autoridad del semillero: sus registros pasan directo a validación.
      const logro = insert(state.logros, {
        idUsuario: user.id,
        idSemillero: body.idSemillero,
        idTipoLogro: body.idTipoLogro,
        idProyecto: body.idProyecto ?? null,
        titulo: body.titulo.trim(),
        descripcion: body.descripcion?.trim() ?? '',
        evidencia: body.evidencia,
        estado: esLider ? 'en_validacion' : 'registrado',
        xpAsignado: 0,
        idValidador: null,
        motivoRechazo: null,
        fechaRegistro: now(),
        fechaValidacion: null,
      });

      const semillero = byId(state.semilleros, logro.idSemillero);
      notificar(
        state,
        esLider ? idsPorRol(state, 'administrador') : [semillero.idDocenteLider],
        {
          tipo: 'logro',
          mensaje: esLider
            ? `El semillero "${semillero.nombre}" envió un logro a validación.`
            : `${user.nombre} registró un logro para tu revisión.`,
          ruta: '/app/validaciones',
        },
      );

      return ok(
        vistaLogro(state, logro),
        esLider ? 'Logro enviado a validación del administrador.' : 'Logro registrado. Tu líder lo revisará y lo enviará a validación.',
        201,
      );
    }, MIEMBROS),
  ),

  http.patch(
    '/api/logros/:id/enviar',
    secured(({ params, state, user }) => {
      const logro = byId(state.logros, Number(params.id));
      if (!logro) return notFound('El logro');
      if (!esLiderDe(state, user, logro.idSemillero)) return fail('Solo el líder del semillero puede enviar logros a validación.', 403);
      if (logro.estado !== 'registrado') return fail('Este logro ya no está pendiente de revisión del líder.', 409);

      logro.estado = 'en_validacion';
      notificar(state, idsPorRol(state, 'administrador'), {
        tipo: 'logro',
        mensaje: `El semillero "${nameOf(state.semilleros, logro.idSemillero)}" envió un logro a validación.`,
        ruta: '/app/validaciones',
      });
      return ok(null, 'Logro enviado a validación del administrador.');
    }, ['docente_lider']),
  ),

  http.patch(
    '/api/logros/:id/aprobar',
    secured(({ params, state, user }) => {
      const logro = byId(state.logros, Number(params.id));
      if (!logro) return notFound('El logro');
      if (logro.estado !== 'en_validacion') return fail('Solo se pueden aprobar logros en validación.', 409);

      const antes = progresoDeSemillero(state, logro.idSemillero).nivel;
      Object.assign(logro, {
        estado: 'aprobado',
        xpAsignado: byId(state.tiposLogro, logro.idTipoLogro).xp,
        idValidador: user.id,
        fechaValidacion: now(),
      });
      const despues = progresoDeSemillero(state, logro.idSemillero).nivel;
      const insignias = otorgarInsignias(state, { idUsuario: logro.idUsuario, idSemillero: logro.idSemillero });

      const semillero = byId(state.semilleros, logro.idSemillero);
      notificar(state, [logro.idUsuario, semillero.idDocenteLider], {
        tipo: 'logro',
        mensaje: `Logro aprobado: "${logro.titulo}" suma ${logro.xpAsignado} XP a "${semillero.nombre}".`,
        ruta: '/app/logros',
      });
      if (despues > antes) {
        notificar(state, [semillero.idDocenteLider, logro.idUsuario], {
          tipo: 'nivel',
          mensaje: `"${semillero.nombre}" alcanzó el nivel ${despues}.`,
          ruta: '/app/ranking',
        });
      }

      const extras = [
        despues > antes && `El semillero subió al nivel ${despues}.`,
        insignias.length > 0 && `Nuevas insignias: ${insignias.map((i) => i.nombre).join(', ')}.`,
      ].filter(Boolean);
      return ok(vistaLogro(state, logro), [`Logro aprobado: +${logro.xpAsignado} XP para el semillero.`, ...extras].join(' '));
    }, ADMIN),
  ),

  http.patch(
    '/api/logros/:id/rechazar',
    secured(async ({ request, params, state, user }) => {
      const logro = byId(state.logros, Number(params.id));
      if (!logro) return notFound('El logro');

      const esLider = esLiderDe(state, user, logro.idSemillero);
      const permitido = (esLider && logro.estado === 'registrado') || (user.rol === 'administrador' && logro.estado === 'en_validacion');
      if (!permitido) return fail('No puedes rechazar este logro en su estado actual.', 403);

      const { motivo } = await readBody(request);
      const invalid = missingFields({ motivo }, ['motivo']);
      if (invalid) return invalid;

      Object.assign(logro, { estado: 'rechazado', motivoRechazo: motivo, idValidador: user.id, fechaValidacion: now() });
      notificar(state, [logro.idUsuario], {
        tipo: 'logro',
        mensaje: `Tu logro "${logro.titulo}" no fue aprobado. Motivo: ${motivo}`,
        ruta: '/app/logros',
      });
      return ok(null, 'Logro rechazado. Se notificó al autor.');
    }, [...ADMIN, 'docente_lider']),
  ),
];
