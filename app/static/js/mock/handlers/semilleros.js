import { http } from '../router.js';
import {
  byId,
  esLiderDe,
  esMiembroActivo,
  insert,
  nameOf,
  notificar,
  now,
  semillerosDe,
  vistaProyecto,
  vistaSemillero,
  vistaUsuario,
} from '../domain.js';
import { crud, fail, missingFields, notFound, ok, readBody, secured, toNumbers } from './helpers.js';

const ADMIN = ['administrador'];
const LIDER = ['docente_lider'];
const ESTUDIANTE = ['estudiante'];
const REQUERIDOS = ['nombre', 'descripcion', 'idFacultad', 'idDocenteLider'];
const NUMERICOS = ['idFacultad', 'idDocenteLider'];

/** El líder del semillero (o el administrador) puede gestionarlo. */
const gestiona = (s, user, idSemillero) => user.rol === 'administrador' || esLiderDe(s, user, idSemillero);

/** Solicitud de vinculación con los datos que necesita la interfaz. */
const vistaVinculacion = (s, i) => ({
  ...i,
  semillero: nameOf(s.semilleros, i.idSemillero),
  usuario: nameOf(s.usuarios, i.idUsuario),
  programa: vistaUsuario(s, byId(s.usuarios, i.idUsuario)).programa,
});

const { update, remove } = crud('semilleros', {
  required: REQUERIDOS,
  numeric: NUMERICOS,
  dependents: [
    ['proyectos', 'idSemillero', 'proyectos'],
    ['integrantes', 'idSemillero', 'integrantes'],
  ],
});

/** RF-2.1, RF-2.2, RF-2.6, RF-2.7: semilleros, integrantes, vinculaciones y seguimiento. */
export const semillerosHandlers = [
  http.get(
    '/api/semilleros',
    secured(({ request, state, user }) => {
      const params = new URL(request.url).searchParams;
      const q = (params.get('q') ?? '').toLowerCase();
      const propios = params.get('mios') === 'true' ? semillerosDe(state, user) : null;

      const rows = state.semilleros
        .filter((se) => !propios || propios.includes(se.id))
        .filter((se) => `${se.nombre} ${nameOf(state.facultades, se.idFacultad)}`.toLowerCase().includes(q))
        .map((se) => vistaSemillero(state, se, user));
      return ok(rows);
    }),
  ),

  http.get(
    '/api/semilleros/:id',
    secured(({ params, state, user }) => {
      const se = byId(state.semilleros, Number(params.id));
      if (!se) return notFound('El semillero');

      const puedeGestionar = gestiona(state, user, se.id);
      const integrantes = state.integrantes
        .filter((i) => i.idSemillero === se.id && i.estado === 'activo')
        .map((i) => vistaVinculacion(state, i));
      const solicitudes = puedeGestionar
        ? state.integrantes.filter((i) => i.idSemillero === se.id && i.estado === 'pendiente').map((i) => vistaVinculacion(state, i))
        : [];
      const veTodo = puedeGestionar || esMiembroActivo(state, user.id, se.id);

      return ok({
        ...vistaSemillero(state, se, user),
        integrantes,
        solicitudes,
        proyectos: state.proyectos.filter((p) => p.idSemillero === se.id && (veTodo || p.esPublico)).map((p) => vistaProyecto(state, p)),
        insignias: state.insigniasSemillero
          .filter((i) => i.idSemillero === se.id)
          .map((i) => ({ ...byId(state.insignias, i.idInsignia), fecha: i.fecha, obtenida: true })),
        seguidores: state.seguimientos.filter((f) => f.idSemillero === se.id).length,
      });
    }),
  ),

  // Solo el administrador crea semilleros y les asigna líder (esa creación es la validación).
  http.post(
    '/api/semilleros',
    secured(async ({ request, state }) => {
      const body = toNumbers(await readBody(request), NUMERICOS);
      const invalid = missingFields(body, REQUERIDOS);
      if (invalid) return invalid;
      if (byId(state.usuarios, body.idDocenteLider)?.rol !== 'docente_lider') {
        return fail('El líder asignado debe tener el rol de docente líder.', 422);
      }

      const se = insert(state.semilleros, { ...body, creadoEn: now() });
      notificar(state, [se.idDocenteLider], {
        tipo: 'semillero',
        mensaje: `Fuiste asignado como líder del semillero "${se.nombre}".`,
        ruta: `/app/semilleros/${se.id}`,
      });
      return ok(se, 'Semillero creado correctamente.', 201);
    }, ADMIN),
  ),
  update,
  remove,

  http.post(
    '/api/semilleros/:id/seguimiento',
    secured(({ params, state, user }) => {
      const idSemillero = Number(params.id);
      if (!byId(state.semilleros, idSemillero)) return notFound('El semillero');
      if (!state.seguimientos.some((f) => f.idSemillero === idSemillero && f.idUsuario === user.id)) {
        state.seguimientos.push({ idUsuario: user.id, idSemillero });
      }
      return ok(null, 'Ahora sigues este semillero.');
    }),
  ),

  http.delete(
    '/api/semilleros/:id/seguimiento',
    secured(({ params, state, user }) => {
      state.seguimientos = state.seguimientos.filter((f) => !(f.idSemillero === Number(params.id) && f.idUsuario === user.id));
      return ok(null, 'Dejaste de seguir este semillero.');
    }),
  ),

  http.post(
    '/api/semilleros/:id/integrantes',
    secured(async ({ request, params, state, user }) => {
      const idSemillero = Number(params.id);
      if (!gestiona(state, user, idSemillero)) return fail('Solo el líder del semillero puede agregar integrantes.', 403);

      const { idUsuario, rol } = toNumbers(await readBody(request), ['idUsuario']);
      const invalid = missingFields({ idUsuario, rol }, ['idUsuario', 'rol']);
      if (invalid) return invalid;

      const existente = state.integrantes.find((i) => i.idSemillero === idSemillero && i.idUsuario === idUsuario);
      if (existente?.estado === 'activo') return fail('Esa persona ya es integrante del semillero.', 409);

      if (existente) Object.assign(existente, { estado: 'activo', rol, fechaIngreso: now() });
      else insert(state.integrantes, { idSemillero, idUsuario, rol, estado: 'activo', fechaIngreso: now() });

      notificar(state, [idUsuario], {
        tipo: 'vinculacion',
        mensaje: `Ahora eres integrante de "${nameOf(state.semilleros, idSemillero)}".`,
        ruta: `/app/semilleros/${idSemillero}`,
      });
      return ok(null, 'Integrante agregado correctamente.', 201);
    }),
  ),

  http.patch(
    '/api/integrantes/:id',
    secured(async ({ request, params, state, user }) => {
      const integrante = byId(state.integrantes, Number(params.id));
      if (!integrante) return notFound('El integrante');
      if (!gestiona(state, user, integrante.idSemillero)) return fail('Solo el líder del semillero puede cambiar roles.', 403);

      integrante.rol = (await readBody(request)).rol;
      return ok(null, 'Rol actualizado correctamente.');
    }),
  ),

  http.delete(
    '/api/integrantes/:id',
    secured(({ params, state, user }) => {
      const integrante = byId(state.integrantes, Number(params.id));
      if (!integrante) return notFound('El integrante');
      if (!gestiona(state, user, integrante.idSemillero)) return fail('Solo el líder del semillero puede retirar integrantes.', 403);

      state.integrantes = state.integrantes.filter((i) => i.id !== integrante.id);
      return ok(null, 'Integrante retirado del semillero.');
    }),
  ),

  http.get(
    '/api/vinculaciones',
    secured(({ request, state, user }) => {
      const estado = new URL(request.url).searchParams.get('estado');
      const propias = semillerosDe(state, user);

      const rows = state.integrantes
        .filter((i) => (user.rol === 'estudiante' ? i.idUsuario === user.id : propias.includes(i.idSemillero)))
        .filter((i) => !estado || i.estado === estado)
        .map((i) => vistaVinculacion(state, i));
      return ok(rows);
    }),
  ),

  http.post(
    '/api/vinculaciones',
    secured(async ({ request, state, user }) => {
      const { idSemillero } = toNumbers(await readBody(request), ['idSemillero']);
      const se = byId(state.semilleros, idSemillero);
      if (!se) return notFound('El semillero');

      const existente = state.integrantes.find((i) => i.idSemillero === idSemillero && i.idUsuario === user.id);
      if (existente?.estado === 'activo') return fail('Ya eres integrante de este semillero.', 409);
      if (existente?.estado === 'pendiente') return fail('Ya tienes una solicitud pendiente para este semillero.', 409);

      const datos = { estado: 'pendiente', rol: 'Joven investigador', fechaIngreso: now() };
      if (existente) Object.assign(existente, datos);
      else insert(state.integrantes, { idSemillero, idUsuario: user.id, ...datos });

      notificar(state, [se.idDocenteLider], {
        tipo: 'vinculacion',
        mensaje: `${user.nombre} solicitó vincularse a "${se.nombre}".`,
        ruta: '/app/validaciones',
      });
      return ok(null, 'Solicitud enviada. El líder del semillero la revisará.', 201);
    }, ESTUDIANTE),
  ),

  http.patch(
    '/api/vinculaciones/:id',
    secured(async ({ request, params, state, user }) => {
      const solicitud = byId(state.integrantes, Number(params.id));
      if (!solicitud) return notFound('La solicitud');
      if (!esLiderDe(state, user, solicitud.idSemillero)) return fail('Solo el líder del semillero puede resolver solicitudes.', 403);

      const { estado } = await readBody(request);
      if (!['activo', 'rechazado'].includes(estado)) return fail('Estado no válido.', 422);

      Object.assign(solicitud, { estado, ...(estado === 'activo' && { fechaIngreso: now() }) });
      const nombre = nameOf(state.semilleros, solicitud.idSemillero);
      notificar(state, [solicitud.idUsuario], {
        tipo: 'vinculacion',
        mensaje:
          estado === 'activo'
            ? `Tu solicitud fue aprobada: ya eres integrante de "${nombre}".`
            : `Tu solicitud de vinculación a "${nombre}" no fue aprobada.`,
        ruta: `/app/semilleros/${solicitud.idSemillero}`,
      });
      return ok(null, estado === 'activo' ? 'Solicitud aprobada.' : 'Solicitud rechazada.');
    }, LIDER),
  ),
];
