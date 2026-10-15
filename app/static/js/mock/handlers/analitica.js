import { http } from '../router.js';
import {
  byId,
  daysBetween,
  nameOf,
  progresoDeSemillero,
  rankingInvestigadores,
  rankingSemilleros,
  semillerosDe,
  ultimaActividad,
  xpDeUsuario,
} from '../domain.js';
import { ok, secured } from './helpers.js';

const DIAS_SIN_ACTIVIDAD = 90;
const promedio = (values) => (values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0);
const porcentaje = (parte, total) => (total ? Math.round((parte / total) * 100) : 0);

/** Últimos movimientos relevantes en los semilleros del usuario (logros aprobados y publicaciones). */
function actividadReciente(s, ids) {
  return [
    ...s.logros
      .filter((l) => ids.includes(l.idSemillero) && l.estado === 'aprobado')
      .map((l) => ({ tipo: 'logro', texto: `${nameOf(s.usuarios, l.idUsuario)} logró "${l.titulo}" (+${l.xpAsignado} XP)`, fecha: l.fechaValidacion })),
    ...s.publicaciones
      .filter((p) => ids.includes(p.idSemillero) && p.estado === 'publicada')
      .map((p) => ({ tipo: 'publicacion', texto: `${nameOf(s.usuarios, p.idUsuario)} publicó en ${p.categoria}`, fecha: p.fecha })),
  ]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 5);
}

/** RF-6.1: resumen único según el rol, para cargar el panel con una sola petición. */
function dashboard(s, user) {
  if (user.rol === 'administrador') {
    return {
      rol: user.rol,
      pendientes: {
        cuentas: s.usuarios.filter((u) => u.estado === 'pendiente').length,
        logros: s.logros.filter((l) => l.estado === 'en_validacion').length,
        postulaciones: s.postulaciones.filter((p) => p.estado === 'pendiente').length,
      },
      totales: {
        usuarios: s.usuarios.filter((u) => u.estado === 'aprobado').length,
        semilleros: s.semilleros.length,
        publicaciones: s.publicaciones.filter((p) => p.estado === 'publicada').length,
        logrosAprobados: s.logros.filter((l) => l.estado === 'aprobado').length,
      },
      ranking: rankingSemilleros(s).slice(0, 3),
    };
  }

  const ids = semillerosDe(s, user);
  const posiciones = rankingSemilleros(s);
  const propios = s.semilleros.filter((se) => ids.includes(se.id));
  const esLider = user.rol === 'docente_lider';

  return {
    rol: user.rol,
    semilleros: propios.map((se) => ({
      id: se.id,
      nombre: se.nombre,
      progreso: progresoDeSemillero(s, se.id),
      posicion: posiciones.find((p) => p.id === se.id).posicion,
      totalSemilleros: posiciones.length,
    })),
    xpAportado: xpDeUsuario(s, user.id),
    insignias: s.insigniasUsuario
      .filter((i) => i.idUsuario === user.id)
      .map((i) => ({ ...byId(s.insignias, i.idInsignia), obtenida: true })),
    pendientes: esLider
      ? {
          vinculaciones: s.integrantes.filter((i) => ids.includes(i.idSemillero) && i.estado === 'pendiente').length,
          publicaciones: s.publicaciones.filter((p) => ids.includes(p.idSemillero) && p.estado === 'pendiente').length,
          logros: s.logros.filter((l) => ids.includes(l.idSemillero) && l.estado === 'registrado').length,
        }
      : {
          logros: s.logros.filter((l) => l.idUsuario === user.id && ['registrado', 'en_validacion'].includes(l.estado)).length,
          solicitudes: s.integrantes.filter((i) => i.idUsuario === user.id && i.estado === 'pendiente').length,
        },
    actividad: actividadReciente(s, ids),
  };
}

/** Insignias del catálogo con progreso hacia cada regla (para el usuario y su semillero principal). */
function insigniasConProgreso(s, user) {
  const aprobados = s.logros.filter((l) => l.estado === 'aprobado');
  const idSemillero = semillerosDe(s, user)[0];

  const evaluar = (ambito, logros, obtenidas) =>
    s.insignias
      .filter((i) => i.ambito === ambito)
      .map((i) => {
        const actual = logros.filter((l) => !i.idTipoLogro || l.idTipoLogro === i.idTipoLogro).length;
        const otorgada = obtenidas.find((o) => o.idInsignia === i.id);
        return { ...i, obtenida: Boolean(otorgada), fecha: otorgada?.fecha ?? null, progreso: { actual: Math.min(actual, i.cantidad), requerido: i.cantidad } };
      });

  return {
    usuario: evaluar('usuario', aprobados.filter((l) => l.idUsuario === user.id), s.insigniasUsuario.filter((i) => i.idUsuario === user.id)),
    semillero: idSemillero
      ? evaluar('semillero', aprobados.filter((l) => l.idSemillero === idSemillero), s.insigniasSemillero.filter((i) => i.idSemillero === idSemillero))
      : [],
  };
}

/**
 * RF-6.2 y RF-6.4: indicadores pensados para tomar decisiones, no solo para contar.
 * Cada bloque responde una pregunta concreta de gestión.
 */
function indicadores(s) {
  const aprobados = s.logros.filter((l) => l.estado === 'aprobado');
  const facultadDe = (idSemillero) => byId(s.semilleros, idSemillero).idFacultad;
  const estudiantes = s.usuarios.filter((u) => u.rol === 'estudiante' && u.estado === 'aprobado');
  const vinculados = new Set(s.integrantes.filter((i) => i.estado === 'activo').map((i) => i.idUsuario));
  const inactivo = (se) => {
    const ultima = ultimaActividad(s, se.id);
    return !ultima || daysBetween(ultima) > DIAS_SIN_ACTIVIDAD;
  };
  const enValidacion = s.logros.filter((l) => l.estado === 'en_validacion');
  const resueltos = s.logros.filter((l) => ['aprobado', 'rechazado'].includes(l.estado));

  return {
    resumen: {
      semillerosActivos: s.semilleros.filter((se) => !inactivo(se)).length,
      publicaciones: s.publicaciones.filter((p) => p.estado === 'publicada').length,
      logrosAprobados: aprobados.length,
      convocatoriasAbiertas: s.convocatorias.filter((c) => new Date(c.fechaLimite) > new Date()).length,
    },
    productividadPorFacultad: s.facultades.map((f) => {
      const propios = aprobados.filter((l) => facultadDe(l.idSemillero) === f.id);
      return { facultad: f.nombre, logros: propios.length, xp: propios.reduce((t, l) => t + l.xpAsignado, 0) };
    }),
    productosPorTipo: s.tiposLogro.map((t) => ({ tipo: t.nombre, total: aprobados.filter((l) => l.idTipoLogro === t.id).length })),
    vinculacionPorFacultad: s.facultades.map((f) => {
      const delaFacultad = estudiantes.filter((u) => byId(s.programas, u.idPrograma)?.idFacultad === f.id);
      const activos = delaFacultad.filter((u) => vinculados.has(u.id)).length;
      return { facultad: f.nombre, estudiantes: delaFacultad.length, vinculados: activos, tasa: porcentaje(activos, delaFacultad.length) };
    }),
    semillerosInactivos: s.semilleros
      .filter(inactivo)
      .map((se) => ({ id: se.id, nombre: se.nombre, diasSinActividad: ultimaActividad(s, se.id) ? daysBetween(ultimaActividad(s, se.id)) : null })),
    proyectosEstancados: s.proyectos
      .filter((p) => p.estado === 'activo')
      .map((p) => {
        const ultimo = s.avances.filter((a) => a.idProyecto === p.id).map((a) => a.fecha).sort().at(-1) ?? p.fechaInicio;
        return { id: p.id, nombre: p.nombre, semillero: nameOf(s.semilleros, p.idSemillero), diasSinAvance: daysBetween(ultimo) };
      })
      .filter((p) => p.diasSinAvance > DIAS_SIN_ACTIVIDAD),
    validacion: {
      pendientes: enValidacion.length,
      antiguedadPromedioDias: promedio(enValidacion.map((l) => daysBetween(l.fechaRegistro))),
      tasaAprobacion: porcentaje(aprobados.length, resueltos.length),
    },
    convocatorias: s.convocatorias.map((c) => {
      const postulaciones = s.postulaciones.filter((p) => p.idConvocatoria === c.id);
      const aprobadas = postulaciones.filter((p) => p.estado === 'aprobada').length;
      return { titulo: c.titulo, postulaciones: postulaciones.length, aprobadas, tasa: porcentaje(aprobadas, postulaciones.length) };
    }),
    eventos: s.eventos.map((e) => {
      const inscritos = s.participaciones.filter((p) => p.idEvento === e.id).length;
      return { nombre: e.nombre, inscritos, cupos: e.cupos, ocupacion: porcentaje(inscritos, e.cupos) };
    }),
    impactoPorSemillero: s.semilleros.map((se) => {
      const publicaciones = s.publicaciones.filter((p) => p.idSemillero === se.id && p.estado === 'publicada');
      const ids = publicaciones.map((p) => p.id);
      return {
        nombre: se.nombre,
        publicaciones: publicaciones.length,
        interacciones: s.interacciones.filter((i) => ids.includes(i.idPublicacion)).length,
      };
    }),
    distribucionNiveles: s.niveles.map((n) => ({
      nivel: n.nivel,
      semilleros: rankingSemilleros(s).filter((r) => r.nivel === n.nivel).length,
    })),
  };
}

export const analiticaHandlers = [
  http.get('/api/dashboard', secured(({ state, user }) => ok(dashboard(state, user)))),

  http.get(
    '/api/ranking',
    secured(({ request, state }) => {
      const tipo = new URL(request.url).searchParams.get('tipo');
      return ok(tipo === 'investigadores' ? rankingInvestigadores(state) : rankingSemilleros(state));
    }),
  ),

  http.get('/api/insignias/mias', secured(({ state, user }) => ok(insigniasConProgreso(state, user)))),

  http.get('/api/indicadores', secured(({ state }) => ok(indicadores(state)), ['administrador'])),
];
