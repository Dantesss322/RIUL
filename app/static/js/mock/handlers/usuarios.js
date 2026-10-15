import { http } from '../router.js';
import { audienciaDe, byId, nameOf, semillerosDe, vistaUsuario, xpDeUsuario } from '../domain.js';
import { fail, notFound, ok, readBody, secured } from './helpers.js';

const ADMIN = ['administrador'];
const ROLES_VALIDOS = ['administrador', 'docente_lider', 'estudiante'];
const PERFIL_EDITABLE = ['nombre', 'telefono', 'biografia', 'lineasInvestigacion', 'orcid'];

/** Hoja de vida: línea de tiempo con logros aprobados, proyectos, eventos y publicaciones del usuario. */
function hojaDeVida(s, usuario) {
  const logros = s.logros.filter((l) => l.idUsuario === usuario.id && l.estado === 'aprobado');
  const semilleros = semillerosDe(s, usuario);

  const linea = [
    ...logros.map((l) => ({
      tipo: 'logro',
      titulo: l.titulo,
      detalle: `${byId(s.tiposLogro, l.idTipoLogro).nombre} · ${nameOf(s.semilleros, l.idSemillero)}`,
      xp: l.xpAsignado,
      fecha: l.fechaValidacion ?? l.fechaRegistro,
    })),
    ...s.publicaciones
      .filter((p) => p.idUsuario === usuario.id && p.estado === 'publicada')
      .map((p) => ({ tipo: 'publicacion', titulo: p.contenido.slice(0, 90), detalle: p.categoria, fecha: p.fecha })),
    ...s.participaciones
      .filter((p) => p.idUsuario === usuario.id)
      .map((p) => ({ tipo: 'evento', titulo: nameOf(s.eventos, p.idEvento), detalle: 'Participación en evento', fecha: p.fecha })),
    ...s.proyectos
      .filter((p) => semilleros.includes(p.idSemillero))
      .map((p) => ({ tipo: 'proyecto', titulo: p.nombre, detalle: `Proyecto · ${nameOf(s.semilleros, p.idSemillero)}`, fecha: p.fechaInicio })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return {
    usuario: vistaUsuario(s, usuario),
    semilleros: semilleros.map((id) => nameOf(s.semilleros, id)),
    xpAportado: xpDeUsuario(s, usuario.id),
    insignias: s.insigniasUsuario
      .filter((i) => i.idUsuario === usuario.id)
      .map((i) => ({ ...byId(s.insignias, i.idInsignia), fecha: i.fecha, obtenida: true })),
    linea,
  };
}

/** RF-1.4, RF-1.5, RF-4.6, RF-7.2: administración de cuentas, perfil propio y hoja de vida. */
export const usuariosHandlers = [
  http.get(
    '/api/usuarios',
    secured(({ request, state }) => {
      const params = new URL(request.url).searchParams;
      const q = params.get('q')?.toLowerCase() ?? '';
      const rows = state.usuarios
        .filter((u) => (!params.get('estado') || u.estado === params.get('estado')) && (!params.get('rol') || u.rol === params.get('rol')))
        .filter((u) => `${u.nombre} ${u.correo}`.toLowerCase().includes(q))
        .map((u) => vistaUsuario(state, u));
      return ok(rows);
    }, ADMIN),
  ),

  http.get(
    '/api/usuarios/estudiantes',
    secured(({ state }) =>
      ok(
        state.usuarios
          .filter((u) => u.rol === 'estudiante' && u.estado === 'aprobado')
          .map((u) => ({ id: u.id, nombre: u.nombre, programa: vistaUsuario(state, u).programa })),
      ),
    ['administrador', 'docente_lider']),
  ),

  http.put(
    '/api/usuarios/me',
    secured(async ({ request, state, user }) => {
      const body = await readBody(request);
      if (!body.nombre?.trim()) return fail('El nombre es obligatorio.', 422);
      const actual = byId(state.usuarios, user.id);
      PERFIL_EDITABLE.forEach((campo) => {
        if (campo in body) actual[campo] = body[campo].trim();
      });
      return ok(vistaUsuario(state, actual), 'Perfil actualizado correctamente.');
    }),
  ),

  http.patch(
    '/api/usuarios/:id/estado',
    secured(async ({ request, params, state }) => {
      const { estado } = await readBody(request);
      const objetivo = byId(state.usuarios, Number(params.id));
      if (!objetivo) return notFound('El usuario');
      if (!['aprobado', 'rechazado'].includes(estado)) return fail('Estado no válido.', 422);

      objetivo.estado = estado;
      return ok(
        vistaUsuario(state, objetivo),
        estado === 'aprobado' ? `Cuenta de ${objetivo.nombre} aprobada.` : `Solicitud de ${objetivo.nombre} rechazada.`,
      );
    }, ADMIN),
  ),

  http.patch(
    '/api/usuarios/:id/rol',
    secured(async ({ request, params, state }) => {
      const { rol } = await readBody(request);
      const objetivo = byId(state.usuarios, Number(params.id));
      if (!objetivo) return notFound('El usuario');
      if (!ROLES_VALIDOS.includes(rol)) return fail('Rol no válido.', 422);
      if (objetivo.rol === 'docente_lider' && rol !== 'docente_lider' && state.semilleros.some((s) => s.idDocenteLider === objetivo.id)) {
        return fail('Antes de cambiar el rol, asigna otro líder a sus semilleros.', 409);
      }

      objetivo.rol = rol;
      return ok(vistaUsuario(state, objetivo), 'Rol actualizado correctamente.');
    }, ADMIN),
  ),

  http.get(
    '/api/usuarios/:id/hoja-vida',
    secured(({ params, state, user }) => {
      const objetivo = byId(state.usuarios, Number(params.id));
      if (!objetivo) return notFound('El usuario');

      const esPropia = objetivo.id === user.id;
      const lideraAlUsuario = user.rol === 'docente_lider' && semillerosDe(state, user).some((id) => audienciaDe(state, id).includes(objetivo.id));
      if (!esPropia && user.rol !== 'administrador' && !lideraAlUsuario) return fail('No tienes permisos para ver esta hoja de vida.', 403);

      return ok(hojaDeVida(state, objetivo));
    }),
  ),
];
