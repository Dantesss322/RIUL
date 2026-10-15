/**
 * Reglas de negocio del backend simulado.
 *
 * Son funciones puras sobre el estado `s` (la "base de datos" en memoria).
 * Documentan, en código ejecutable, lo que el backend real (Flask) deberá implementar:
 * XP derivado de logros aprobados, nivel por umbrales, insignias por regla y ranking.
 */
export const DAY = 86_400_000;

export const now = () => new Date().toISOString();
export const daysAgo = (days) => new Date(Date.now() - days * DAY).toISOString();
export const daysBetween = (iso) => Math.floor((Date.now() - new Date(iso)) / DAY);

const sum = (rows, pick) => rows.reduce((total, row) => total + pick(row), 0);
const unique = (values) => [...new Set(values)];

export const nextId = (rows) => rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
export const byId = (rows, id) => rows.find((row) => row.id === id);
const nameOf = (rows, id) => byId(rows, id)?.nombre ?? null;

export function insert(rows, item) {
  const row = { id: nextId(rows), ...item };
  rows.push(row);
  return row;
}

/* ------------------------------------------------------------------ */
/* Pertenencia y permisos                                               */
/* ------------------------------------------------------------------ */

export const esLiderDe = (s, user, idSemillero) =>
  user.rol === 'docente_lider' && byId(s.semilleros, idSemillero)?.idDocenteLider === user.id;

export const esMiembroActivo = (s, userId, idSemillero) =>
  s.integrantes.some((i) => i.idSemillero === idSemillero && i.idUsuario === userId && i.estado === 'activo');

/** Ids de los semilleros sobre los que el usuario tiene vínculo (todos para el administrador). */
export function semillerosDe(s, user) {
  if (user.rol === 'administrador') return s.semilleros.map((se) => se.id);
  if (user.rol === 'docente_lider') return s.semilleros.filter((se) => se.idDocenteLider === user.id).map((se) => se.id);
  return s.integrantes.filter((i) => i.idUsuario === user.id && i.estado === 'activo').map((i) => i.idSemillero);
}

/** Líder, integrantes activos y seguidores de un semillero (audiencia de sus novedades). */
export function audienciaDe(s, idSemillero) {
  return unique([
    byId(s.semilleros, idSemillero).idDocenteLider,
    ...s.integrantes.filter((i) => i.idSemillero === idSemillero && i.estado === 'activo').map((i) => i.idUsuario),
    ...s.seguimientos.filter((f) => f.idSemillero === idSemillero).map((f) => f.idUsuario),
  ]);
}

export const idsPorRol = (s, rol) => s.usuarios.filter((u) => u.rol === rol && u.estado === 'aprobado').map((u) => u.id);

/* ------------------------------------------------------------------ */
/* Notificaciones                                                       */
/* ------------------------------------------------------------------ */

/** Crea una notificación por destinatario (sin repetir ni notificar al autor). */
export function notificar(s, destinatarios, { tipo, mensaje, ruta }, excluir = null) {
  unique(destinatarios)
    .filter((idUsuario) => idUsuario !== excluir)
    .forEach((idUsuario) => insert(s.notificaciones, { idUsuario, tipo, mensaje, ruta, leida: false, fecha: now() }));
}

/* ------------------------------------------------------------------ */
/* Gamificación: XP, nivel, insignias y ranking                         */
/* ------------------------------------------------------------------ */

const aprobados = (s) => s.logros.filter((l) => l.estado === 'aprobado');

export const xpDeSemillero = (s, id) => sum(aprobados(s).filter((l) => l.idSemillero === id), (l) => l.xpAsignado);
export const xpDeUsuario = (s, id) => sum(aprobados(s).filter((l) => l.idUsuario === id), (l) => l.xpAsignado);

/** Nivel (1-5 estrellas) a partir del XP, comparando con la tabla de umbrales. */
export function progresoPorXp(s, xp) {
  const niveles = [...s.niveles].sort((a, b) => a.xpMinimo - b.xpMinimo);
  const actual = niveles.findLast((n) => xp >= n.xpMinimo) ?? niveles[0];
  const siguiente = niveles.find((n) => n.xpMinimo > xp) ?? null;
  const porcentaje = siguiente
    ? Math.round(((xp - actual.xpMinimo) / (siguiente.xpMinimo - actual.xpMinimo)) * 100)
    : 100;

  return { nivel: actual.nivel, xp, xpSiguiente: siguiente?.xpMinimo ?? null, porcentaje, nivelMaximo: niveles.length };
}

export const progresoDeSemillero = (s, id) => progresoPorXp(s, xpDeSemillero(s, id));

const cumple = (insignia, logros) =>
  logros.filter((l) => !insignia.idTipoLogro || l.idTipoLogro === insignia.idTipoLogro).length >= insignia.cantidad;

/**
 * Otorga las insignias cuyas reglas ya se cumplen para un usuario y su semillero.
 * Regla única: N logros aprobados del tipo X (o de cualquiera si el tipo es nulo).
 * @returns {{ambito: string, nombre: string}[]} Insignias nuevas.
 */
export function otorgarInsignias(s, { idUsuario, idSemillero }) {
  const logros = aprobados(s);
  const nuevas = [];

  const evaluar = (ambito, propios, tabla, clave, valor) =>
    s.insignias
      .filter((i) => i.ambito === ambito && cumple(i, propios) && !tabla.some((t) => t[clave] === valor && t.idInsignia === i.id))
      .forEach((i) => {
        tabla.push({ [clave]: valor, idInsignia: i.id, fecha: now() });
        nuevas.push({ ambito, nombre: i.nombre });
      });

  evaluar('usuario', logros.filter((l) => l.idUsuario === idUsuario), s.insigniasUsuario, 'idUsuario', idUsuario);
  evaluar('semillero', logros.filter((l) => l.idSemillero === idSemillero), s.insigniasSemillero, 'idSemillero', idSemillero);
  return nuevas;
}

export function rankingSemilleros(s) {
  return s.semilleros
    .map((se) => ({
      id: se.id,
      nombre: se.nombre,
      facultad: nameOf(s.facultades, se.idFacultad),
      ...progresoDeSemillero(s, se.id),
      logros: aprobados(s).filter((l) => l.idSemillero === se.id).length,
    }))
    .sort((a, b) => b.xp - a.xp)
    .map((row, index) => ({ ...row, posicion: index + 1 }));
}

/** Ranking de investigadores por XP aportado con logros aprobados. */
export function rankingInvestigadores(s) {
  return s.usuarios
    .filter((u) => u.rol !== 'administrador' && u.estado === 'aprobado')
    .map((u) => {
      const propios = aprobados(s).filter((l) => l.idUsuario === u.id);
      const idSemillero = propios[0]?.idSemillero ?? semillerosDe(s, u)[0];
      return {
        id: u.id,
        nombre: u.nombre,
        semillero: nameOf(s.semilleros, idSemillero),
        xp: sum(propios, (l) => l.xpAsignado),
        logros: propios.length,
      };
    })
    .filter((row) => row.logros > 0)
    .sort((a, b) => b.xp - a.xp)
    .map((row, index) => ({ ...row, posicion: index + 1 }));
}

/* ------------------------------------------------------------------ */
/* Vistas (forma de las respuestas de la API)                           */
/* ------------------------------------------------------------------ */

export function vistaUsuario(s, u) {
  const { password, ...publico } = u;
  const programa = byId(s.programas, u.idPrograma);
  return { ...publico, programa: programa?.nombre ?? null, facultad: nameOf(s.facultades, programa?.idFacultad) };
}

export function vistaSemillero(s, se, user) {
  const vinculo = s.integrantes.find((i) => i.idSemillero === se.id && i.idUsuario === user.id);
  return {
    ...se,
    facultad: nameOf(s.facultades, se.idFacultad),
    docenteLider: nameOf(s.usuarios, se.idDocenteLider),
    progreso: progresoDeSemillero(s, se.id),
    totalIntegrantes: s.integrantes.filter((i) => i.idSemillero === se.id && i.estado === 'activo').length,
    siguiendo: s.seguimientos.some((f) => f.idSemillero === se.id && f.idUsuario === user.id),
    vinculacion: vinculo ? { id: vinculo.id, estado: vinculo.estado, rol: vinculo.rol } : null,
    esLider: se.idDocenteLider === user.id,
  };
}

export function vistaLogro(s, l) {
  const tipo = byId(s.tiposLogro, l.idTipoLogro);
  return {
    ...l,
    tipo: tipo.nombre,
    xpPotencial: tipo.xp,
    usuario: nameOf(s.usuarios, l.idUsuario),
    semillero: nameOf(s.semilleros, l.idSemillero),
    proyecto: nameOf(s.proyectos, l.idProyecto),
  };
}

export function vistaProyecto(s, p) {
  return {
    ...p,
    semillero: nameOf(s.semilleros, p.idSemillero),
    totalAvances: s.avances.filter((a) => a.idProyecto === p.id).length,
  };
}

export function vistaPublicacion(s, p, user) {
  const propias = s.interacciones.filter((i) => i.idPublicacion === p.id);
  const cuenta = (tipo) => propias.filter((i) => i.tipo === tipo).length;
  return {
    ...p,
    autor: nameOf(s.usuarios, p.idUsuario),
    semillero: nameOf(s.semilleros, p.idSemillero),
    reacciones: cuenta('reaccion'),
    comentarios: cuenta('comentario'),
    compartidos: cuenta('compartido'),
    interacciones: propias.length,
    reaccionado: propias.some((i) => i.tipo === 'reaccion' && i.idUsuario === user.id),
  };
}

/** Última actividad registrada de un semillero (logros, avances y publicaciones). */
export function ultimaActividad(s, idSemillero) {
  const proyectos = s.proyectos.filter((p) => p.idSemillero === idSemillero).map((p) => p.id);
  const fechas = [
    ...s.logros.filter((l) => l.idSemillero === idSemillero).map((l) => l.fechaRegistro),
    ...s.avances.filter((a) => proyectos.includes(a.idProyecto)).map((a) => a.fecha),
    ...s.publicaciones.filter((p) => p.idSemillero === idSemillero).map((p) => p.fecha),
  ];
  return fechas.sort().at(-1) ?? null;
}

export { nameOf };
