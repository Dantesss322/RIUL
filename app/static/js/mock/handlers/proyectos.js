import { http } from '../router.js';
import { byId, esLiderDe, esMiembroActivo, insert, nameOf, now, semillerosDe, vistaLogro, vistaProyecto } from '../domain.js';
import { fail, missingFields, notFound, ok, readBody, secured, toNumbers } from './helpers.js';

const REQUERIDOS = ['nombre', 'descripcion', 'idSemillero'];
const ESTADOS = ['activo', 'en_pausa', 'finalizado'];

/** Quien puede ver el detalle: administrador, líder o integrante activo (o cualquiera si es público). */
const puedeVer = (s, user, p) =>
  p.esPublico || user.rol === 'administrador' || esLiderDe(s, user, p.idSemillero) || esMiembroActivo(s, user.id, p.idSemillero);

/** RF-2.3, RF-2.4, RF-2.5: proyectos, avances y productos (logros asociados al proyecto). */
export const proyectosHandlers = [
  http.get(
    '/api/proyectos',
    secured(({ request, state, user }) => {
      const params = new URL(request.url).searchParams;
      const q = (params.get('q') ?? '').toLowerCase();
      const propios = semillerosDe(state, user);

      const rows = state.proyectos
        .filter((p) => propios.includes(p.idSemillero))
        .filter((p) => !params.get('estado') || p.estado === params.get('estado'))
        .filter((p) => p.nombre.toLowerCase().includes(q))
        .map((p) => vistaProyecto(state, p));
      return ok(rows);
    }),
  ),

  http.get(
    '/api/proyectos/:id',
    secured(({ params, state, user }) => {
      const proyecto = byId(state.proyectos, Number(params.id));
      if (!proyecto) return notFound('El proyecto');
      if (!puedeVer(state, user, proyecto)) return fail('No tienes permisos para ver este proyecto.', 403);

      return ok({
        ...vistaProyecto(state, proyecto),
        puedeGestionar: esLiderDe(state, user, proyecto.idSemillero),
        avances: state.avances
          .filter((a) => a.idProyecto === proyecto.id)
          .sort((a, b) => b.fecha.localeCompare(a.fecha))
          .map((a) => ({ ...a, autor: nameOf(state.usuarios, a.idAutor) })),
        productos: state.logros
          .filter((l) => l.idProyecto === proyecto.id)
          .map((l) => vistaLogro(state, l)),
      });
    }),
  ),

  http.post(
    '/api/proyectos',
    secured(async ({ request, state, user }) => {
      const body = toNumbers(await readBody(request), ['idSemillero']);
      const invalid = missingFields(body, REQUERIDOS);
      if (invalid) return invalid;
      if (!esLiderDe(state, user, body.idSemillero)) return fail('Solo el líder del semillero puede registrar proyectos.', 403);

      const proyecto = insert(state.proyectos, {
        idSemillero: body.idSemillero,
        nombre: body.nombre.trim(),
        descripcion: body.descripcion.trim(),
        estado: 'activo',
        esPublico: body.esPublico === 'true' || body.esPublico === true,
        fechaInicio: now(),
      });
      return ok(vistaProyecto(state, proyecto), 'Proyecto registrado correctamente.', 201);
    }, ['docente_lider']),
  ),

  http.put(
    '/api/proyectos/:id',
    secured(async ({ request, params, state, user }) => {
      const proyecto = byId(state.proyectos, Number(params.id));
      if (!proyecto) return notFound('El proyecto');
      if (!esLiderDe(state, user, proyecto.idSemillero)) return fail('Solo el líder del semillero puede editar el proyecto.', 403);

      const body = await readBody(request);
      if (body.estado && !ESTADOS.includes(body.estado)) return fail('Estado no válido.', 422);
      Object.assign(proyecto, body);
      return ok(vistaProyecto(state, proyecto), 'Proyecto actualizado correctamente.');
    }, ['docente_lider']),
  ),

  http.post(
    '/api/proyectos/:id/avances',
    secured(async ({ request, params, state, user }) => {
      const proyecto = byId(state.proyectos, Number(params.id));
      if (!proyecto) return notFound('El proyecto');
      if (!esLiderDe(state, user, proyecto.idSemillero)) return fail('Solo el líder del semillero puede publicar avances.', 403);

      const body = await readBody(request);
      const invalid = missingFields(body, ['descripcion']);
      if (invalid) return invalid;

      insert(state.avances, {
        idProyecto: proyecto.id,
        idAutor: user.id,
        descripcion: body.descripcion.trim(),
        evidencia: body.evidencia ?? null,
        fecha: now(),
      });
      return ok(null, 'Avance publicado correctamente.', 201);
    }, ['docente_lider']),
  ),
];
