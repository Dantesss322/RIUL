import { http } from '../router.js';
import { byId, idsPorRol, insert, notificar, now, vistaUsuario } from '../domain.js';
import { fail, missingFields, ok, open, readBody, secured } from './helpers.js';

const DOMINIO_INSTITUCIONAL = '@unilibre.edu.co';

/** RF-1.1 a RF-1.4: ingreso, registro con aprobación del administrador y sesión actual. */
export const authHandlers = [
  http.post(
    '/api/auth/login',
    open(async ({ request, state }) => {
      const { correo = '', password } = await readBody(request);
      const user = state.usuarios.find((u) => u.correo === correo.trim().toLowerCase() && u.password === password);

      if (!user) return fail('El correo o la contraseña no son correctos.', 401);
      if (user.estado === 'pendiente') {
        return fail('Tu cuenta aún no ha sido activada. Un administrador debe aprobar tu solicitud antes de que puedas ingresar.', 403);
      }
      if (user.estado === 'rechazado') {
        return fail('Tu solicitud de registro fue rechazada. Comunícate con la coordinación de investigación.', 403);
      }

      return ok({ accessToken: `mock.${user.id}`, user: vistaUsuario(state, user) }, `Bienvenido, ${user.nombre.split(' ')[0]}`);
    }),
  ),

  http.post(
    '/api/auth/register',
    open(async ({ request, state }) => {
      const body = await readBody(request);
      const correo = (body.correo ?? '').trim().toLowerCase();

      const invalid = missingFields(body, ['nombre', 'correo', 'password', 'idPrograma']);
      if (invalid) return invalid;
      if (body.password.length < 8) return fail('La contraseña debe tener al menos 8 caracteres.', 422);
      if (!correo.endsWith(DOMINIO_INSTITUCIONAL) && !body.justificacion?.trim()) {
        return fail('Sin cuenta institucional debes explicar el motivo de tu solicitud.', 422);
      }
      if (state.usuarios.some((u) => u.correo === correo)) return fail('Ya existe una solicitud o cuenta con ese correo.', 409);

      const user = insert(state.usuarios, {
        nombre: body.nombre.trim(),
        correo,
        password: body.password,
        rol: 'estudiante',
        estado: 'pendiente',
        idPrograma: Number(body.idPrograma),
        justificacion: body.justificacion?.trim() ?? '',
        telefono: '',
        biografia: '',
        lineasInvestigacion: '',
        orcid: '',
        creadoEn: now(),
      });
      notificar(state, idsPorRol(state, 'administrador'), {
        tipo: 'cuenta',
        mensaje: `${user.nombre} solicitó acceso a la plataforma.`,
        ruta: '/app/admin/usuarios',
      });

      return ok({ id: user.id, estado: user.estado }, 'Solicitud enviada. Te daremos acceso cuando un administrador la apruebe.', 201);
    }),
  ),

  http.get(
    '/api/auth/me',
    secured(({ state, user }) => ok(vistaUsuario(state, byId(state.usuarios, user.id)))),
  ),
];
