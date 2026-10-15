import { http } from '../router.js';
import {
  audienciaDe,
  byId,
  esLiderDe,
  esMiembroActivo,
  insert,
  nameOf,
  notificar,
  now,
  semillerosDe,
  vistaPublicacion,
} from '../domain.js';
import { fail, missingFields, notFound, ok, readBody, secured, toNumbers } from './helpers.js';

const CATEGORIAS = ['Avance', 'Evento', 'Logro', 'Divulgación', 'Convocatoria'];

/** Avisa a integrantes y seguidores del semillero de una publicación nueva. */
const anunciar = (s, publicacion) =>
  notificar(
    s,
    audienciaDe(s, publicacion.idSemillero),
    {
      tipo: 'publicacion',
      mensaje: `Nueva publicación en "${nameOf(s.semilleros, publicacion.idSemillero)}": ${publicacion.categoria}.`,
      ruta: '/app/publicaciones',
    },
    publicacion.idUsuario,
  );

/**
 * Feed visible para el usuario:
 *  - publicaciones aprobadas de cualquier semillero,
 *  - las propias en cualquier estado,
 *  - con estado=pendiente, las que debe moderar (líder de su semillero o administrador).
 */
function visibles(s, user, estado) {
  if (estado === 'pendiente') {
    const moderables = semillerosDe(s, user);
    return s.publicaciones.filter((p) => p.estado === 'pendiente' && user.rol !== 'estudiante' && moderables.includes(p.idSemillero));
  }
  return s.publicaciones.filter((p) => p.estado === 'publicada' || p.idUsuario === user.id);
}

/** RF-3.1 a RF-3.4: publicaciones con aprobación del líder, interacciones y estadísticas de impacto. */
export const publicacionesHandlers = [
  http.get(
    '/api/publicaciones',
    secured(({ request, state, user }) => {
      const params = new URL(request.url).searchParams;
      const rows = visibles(state, user, params.get('estado'))
        .filter((p) => !params.get('categoria') || p.categoria === params.get('categoria'))
        .filter((p) => !params.get('idSemillero') || p.idSemillero === Number(params.get('idSemillero')))
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .map((p) => vistaPublicacion(state, p, user));
      return ok(rows);
    }),
  ),

  http.post(
    '/api/publicaciones',
    secured(async ({ request, state, user }) => {
      const body = toNumbers(await readBody(request), ['idSemillero']);
      const invalid = missingFields(body, ['contenido', 'categoria', 'idSemillero']);
      if (invalid) return invalid;
      if (!CATEGORIAS.includes(body.categoria)) return fail('Selecciona una categoría válida.', 422);

      const esLider = esLiderDe(state, user, body.idSemillero);
      if (!esLider && !esMiembroActivo(state, user.id, body.idSemillero)) {
        return fail('Solo los integrantes del semillero pueden publicar en su nombre.', 403);
      }

      // El líder publica directo; las de estudiantes esperan su aprobación (RNF-1).
      const publicacion = insert(state.publicaciones, {
        idUsuario: user.id,
        idSemillero: body.idSemillero,
        categoria: body.categoria,
        contenido: body.contenido.trim(),
        evidencia: body.evidencia ?? null,
        esPublico: body.esPublico === 'true',
        estado: esLider ? 'publicada' : 'pendiente',
        fecha: now(),
      });

      if (esLider) anunciar(state, publicacion);
      else {
        notificar(state, [byId(state.semilleros, body.idSemillero).idDocenteLider], {
          tipo: 'publicacion',
          mensaje: `${user.nombre} creó una publicación que espera tu aprobación.`,
          ruta: '/app/validaciones',
        });
      }

      return ok(
        vistaPublicacion(state, publicacion, user),
        esLider ? 'Publicación creada correctamente.' : 'Publicación enviada. Se mostrará cuando tu líder la apruebe.',
        201,
      );
    }, ['docente_lider', 'estudiante']),
  ),

  http.patch(
    '/api/publicaciones/:id/estado',
    secured(async ({ request, params, state, user }) => {
      const publicacion = byId(state.publicaciones, Number(params.id));
      if (!publicacion) return notFound('La publicación');
      if (!esLiderDe(state, user, publicacion.idSemillero)) return fail('Solo el líder del semillero puede moderar publicaciones.', 403);

      const { estado } = await readBody(request);
      if (!['publicada', 'rechazada'].includes(estado)) return fail('Estado no válido.', 422);

      publicacion.estado = estado;
      if (estado === 'publicada') anunciar(state, publicacion);
      notificar(state, [publicacion.idUsuario], {
        tipo: 'publicacion',
        mensaje: estado === 'publicada' ? 'Tu publicación fue aprobada y ya es visible.' : 'Tu publicación no fue aprobada por el líder del semillero.',
        ruta: '/app/publicaciones',
      });
      return ok(null, estado === 'publicada' ? 'Publicación aprobada.' : 'Publicación rechazada.');
    }, ['docente_lider']),
  ),

  http.post(
    '/api/publicaciones/:id/reaccion',
    secured(({ params, state, user }) => {
      const idPublicacion = Number(params.id);
      if (!byId(state.publicaciones, idPublicacion)) return notFound('La publicación');

      const previa = state.interacciones.find((i) => i.idPublicacion === idPublicacion && i.idUsuario === user.id && i.tipo === 'reaccion');
      if (previa) state.interacciones = state.interacciones.filter((i) => i.id !== previa.id);
      else insert(state.interacciones, { idPublicacion, idUsuario: user.id, tipo: 'reaccion', contenido: null, fecha: now() });

      return ok({ reaccionado: !previa });
    }),
  ),

  http.get(
    '/api/publicaciones/:id/comentarios',
    secured(({ params, state }) =>
      ok(
        state.interacciones
          .filter((i) => i.idPublicacion === Number(params.id) && i.tipo === 'comentario')
          .map((i) => ({ ...i, autor: nameOf(state.usuarios, i.idUsuario) })),
      ),
    ),
  ),

  http.post(
    '/api/publicaciones/:id/comentarios',
    secured(async ({ request, params, state, user }) => {
      const { contenido } = await readBody(request);
      if (!contenido?.trim()) return fail('Escribe un comentario antes de enviarlo.', 422);
      if (!byId(state.publicaciones, Number(params.id))) return notFound('La publicación');

      insert(state.interacciones, { idPublicacion: Number(params.id), idUsuario: user.id, tipo: 'comentario', contenido: contenido.trim(), fecha: now() });
      return ok(null, 'Comentario publicado.', 201);
    }),
  ),

  http.post(
    '/api/publicaciones/:id/compartir',
    secured(({ params, state, user }) => {
      if (!byId(state.publicaciones, Number(params.id))) return notFound('La publicación');
      insert(state.interacciones, { idPublicacion: Number(params.id), idUsuario: user.id, tipo: 'compartido', contenido: null, fecha: now() });
      return ok(null, 'Publicación compartida.', 201);
    }),
  ),
];
