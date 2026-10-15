import { http } from '../router.js';
import { byId, daysBetween, idsPorRol, insert, nameOf, notificar, now } from '../domain.js';
import { crud, fail, missingFields, notFound, ok, readBody, secured } from './helpers.js';

const MIEMBROS = ['docente_lider', 'estudiante'];

const eventos = crud('eventos', {
  required: ['nombre', 'descripcion', 'fecha', 'lugar', 'modalidad', 'cupos'],
  numeric: ['cupos'],
  dependents: [['participaciones', 'idEvento', 'participaciones']],
});

const convocatorias = crud('convocatorias', {
  required: ['titulo', 'descripcion', 'fechaLimite'],
  dependents: [['postulaciones', 'idConvocatoria', 'postulaciones']],
});

const esFutura = (iso) => new Date(iso) > new Date();

/** RF-2.8, RF-5.1 a RF-5.3: eventos institucionales, convocatorias y postulaciones. */
export const eventosHandlers = [
  http.get(
    '/api/eventos',
    secured(({ state, user }) =>
      ok(
        state.eventos
          .map((e) => {
            const inscritos = state.participaciones.filter((p) => p.idEvento === e.id).length;
            return {
              ...e,
              inscritos,
              cuposDisponibles: Math.max(e.cupos - inscritos, 0),
              pasado: !esFutura(e.fecha),
              inscrito: state.participaciones.some((p) => p.idEvento === e.id && p.idUsuario === user.id),
            };
          })
          .sort((a, b) => a.fecha.localeCompare(b.fecha)),
      ),
    ),
  ),
  eventos.create,
  eventos.update,
  eventos.remove,

  http.post(
    '/api/eventos/:id/participaciones',
    secured(({ params, state, user }) => {
      const evento = byId(state.eventos, Number(params.id));
      if (!evento) return notFound('El evento');
      if (!esFutura(evento.fecha)) return fail('Este evento ya finalizó.', 409);
      if (state.participaciones.some((p) => p.idEvento === evento.id && p.idUsuario === user.id)) {
        return fail('Ya registraste tu participación en este evento.', 409);
      }
      if (state.participaciones.filter((p) => p.idEvento === evento.id).length >= evento.cupos) {
        return fail('Este evento ya no tiene cupos disponibles.', 409);
      }

      state.participaciones.push({ idEvento: evento.id, idUsuario: user.id, fecha: now() });
      return ok(null, `Participación registrada en "${evento.nombre}".`, 201);
    }, MIEMBROS),
  ),

  http.get(
    '/api/convocatorias',
    secured(({ state, user }) =>
      ok(
        state.convocatorias
          .map((c) => ({
            ...c,
            abierta: esFutura(c.fechaLimite),
            diasRestantes: Math.max(-daysBetween(c.fechaLimite), 0),
            miPostulacion: state.postulaciones.find((p) => p.idConvocatoria === c.id && p.idUsuario === user.id)?.estado ?? null,
          }))
          .sort((a, b) => a.fechaLimite.localeCompare(b.fechaLimite)),
      ),
    ),
  ),

  http.post(
    '/api/convocatorias',
    secured(async ({ request, state, user }) => {
      const body = await readBody(request);
      const invalid = missingFields(body, ['titulo', 'descripcion', 'fechaLimite']);
      if (invalid) return invalid;

      const convocatoria = insert(state.convocatorias, { ...body, idCreador: user.id });
      notificar(state, state.usuarios.filter((u) => u.estado === 'aprobado' && u.rol !== 'administrador').map((u) => u.id), {
        tipo: 'convocatoria',
        mensaje: `Nueva convocatoria: ${convocatoria.titulo}.`,
        ruta: '/app/eventos',
      });
      return ok(convocatoria, 'Convocatoria publicada y notificada a la comunidad.', 201);
    }, ['administrador']),
  ),
  convocatorias.update,
  convocatorias.remove,

  http.post(
    '/api/convocatorias/:id/postulaciones',
    secured(({ params, state, user }) => {
      const convocatoria = byId(state.convocatorias, Number(params.id));
      if (!convocatoria) return notFound('La convocatoria');
      if (!esFutura(convocatoria.fechaLimite)) return fail('Esta convocatoria ya cerró.', 409);
      if (state.postulaciones.some((p) => p.idConvocatoria === convocatoria.id && p.idUsuario === user.id)) {
        return fail('Ya te postulaste a esta convocatoria.', 409);
      }

      insert(state.postulaciones, { idConvocatoria: convocatoria.id, idUsuario: user.id, estado: 'pendiente', fecha: now() });
      notificar(state, idsPorRol(state, 'administrador'), {
        tipo: 'postulacion',
        mensaje: `${user.nombre} se postuló a "${convocatoria.titulo}".`,
        ruta: '/app/validaciones',
      });
      return ok(null, 'Postulación enviada correctamente.', 201);
    }, ['estudiante']),
  ),

  http.get(
    '/api/postulaciones',
    secured(({ request, state }) => {
      const estado = new URL(request.url).searchParams.get('estado');
      return ok(
        state.postulaciones
          .filter((p) => !estado || p.estado === estado)
          .map((p) => ({
            ...p,
            convocatoria: byId(state.convocatorias, p.idConvocatoria)?.titulo,
            usuario: nameOf(state.usuarios, p.idUsuario),
          })),
      );
    }, ['administrador']),
  ),

  http.patch(
    '/api/postulaciones/:id',
    secured(async ({ request, params, state }) => {
      const postulacion = byId(state.postulaciones, Number(params.id));
      if (!postulacion) return notFound('La postulación');

      const { estado } = await readBody(request);
      if (!['aprobada', 'rechazada'].includes(estado)) return fail('Estado no válido.', 422);

      postulacion.estado = estado;
      notificar(state, [postulacion.idUsuario], {
        tipo: 'postulacion',
        mensaje: `Tu postulación a "${byId(state.convocatorias, postulacion.idConvocatoria).titulo}" fue ${estado === 'aprobada' ? 'aprobada' : 'rechazada'}.`,
        ruta: '/app/eventos',
      });
      return ok(null, estado === 'aprobada' ? 'Postulación aprobada.' : 'Postulación rechazada.');
    }, ['administrador']),
  ),
];
