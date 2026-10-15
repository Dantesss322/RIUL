import { daysAgo, insert, otorgarInsignias } from './domain.js';

/**
 * Base de datos en memoria del backend simulado.
 * Se siembra una vez y se persiste en localStorage para que la demostración
 * conserve los cambios entre recargas. `reset()` vuelve a los datos iniciales.
 *
 * La forma de cada colección replica las tablas del MER (database/01_schema.sql).
 */
// Subir el sufijo cuando cambie la forma de los datos sembrados para descartar copias antiguas.
const KEY = 'riul.mock.db.v2';
export const DEMO_PASSWORD = 'Riul2026*';

const slug = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '.');

const usuario = (id, nombre, rol, idPrograma, extra = {}) => ({
  id,
  nombre,
  rol,
  idPrograma,
  estado: 'aprobado',
  correo: `${slug(nombre)}@unilibre.edu.co`,
  password: DEMO_PASSWORD,
  justificacion: '',
  telefono: '',
  biografia: '',
  lineasInvestigacion: '',
  orcid: '',
  creadoEn: daysAgo(220),
  ...extra,
});

function buildSeed() {
  const s = {
    facultades: [
      { id: 1, nombre: 'Ingeniería' },
      { id: 2, nombre: 'Derecho, Ciencias Políticas y Sociales' },
      { id: 3, nombre: 'Ciencias de la Salud' },
      { id: 4, nombre: 'Ciencias Económicas, Administrativas y Contables' },
    ],
    programas: [
      { id: 1, nombre: 'Ingeniería de Sistemas', idFacultad: 1 },
      { id: 2, nombre: 'Ingeniería Industrial', idFacultad: 1 },
      { id: 3, nombre: 'Ingeniería Ambiental', idFacultad: 1 },
      { id: 4, nombre: 'Derecho', idFacultad: 2 },
      { id: 5, nombre: 'Medicina', idFacultad: 3 },
      { id: 6, nombre: 'Enfermería', idFacultad: 3 },
      { id: 7, nombre: 'Contaduría Pública', idFacultad: 4 },
      { id: 8, nombre: 'Administración de Empresas', idFacultad: 4 },
    ],
    usuarios: [
      usuario(1, 'Administrador RIUL', 'administrador', null, { correo: 'admin@unilibre.edu.co' }),
      usuario(2, 'Marcela Quintero', 'docente_lider', 1, {
        biografia: 'Docente investigadora en analítica del aprendizaje y minería de datos educativos.',
        lineasInvestigacion: 'Ciencia de datos, aprendizaje automático, analítica educativa',
        orcid: '0000-0002-1825-0097',
      }),
      usuario(3, 'Julián Barrios', 'docente_lider', 1),
      usuario(4, 'Patricia Londoño', 'docente_lider', 4),
      usuario(5, 'Andrés Villamil', 'docente_lider', 5),
      usuario(6, 'Sofía Cárdenas', 'docente_lider', 7),
      usuario(7, 'Camila Rojas', 'estudiante', 1, { biografia: 'Estudiante de octavo semestre interesada en modelos predictivos.' }),
      usuario(8, 'Daniel Herrera', 'estudiante', 1),
      usuario(9, 'Valentina Mora', 'estudiante', 2),
      usuario(10, 'Santiago Pardo', 'estudiante', 1),
      usuario(11, 'Laura Gómez', 'estudiante', 1),
      usuario(12, 'Mateo Ríos', 'estudiante', 2),
      usuario(13, 'Isabella Torres', 'estudiante', 4),
      usuario(14, 'Sebastián Castro', 'estudiante', 4),
      usuario(15, 'Mariana Ospina', 'estudiante', 5),
      usuario(16, 'Felipe Ortiz', 'estudiante', 6),
      usuario(17, 'Natalia Vargas', 'estudiante', 7),
      usuario(18, 'Andrés Felipe Cruz', 'estudiante', 8),
      usuario(19, 'Juliana Prieto', 'estudiante', 3, { estado: 'pendiente', creadoEn: daysAgo(2) }),
      usuario(20, 'Carlos Medina', 'estudiante', 8, {
        estado: 'pendiente',
        correo: 'carlos.medina@gmail.com',
        justificacion: 'Soy egresado y colaboro con el semillero de finanzas en un proyecto conjunto con mi empresa.',
        creadoEn: daysAgo(1),
      }),
    ],
    semilleros: [
      { id: 1, nombre: 'Inteligencia Artificial y Ciencia de Datos', descripcion: 'Modelos predictivos, aprendizaje automático y analítica aplicada a problemas institucionales.', idFacultad: 1, idDocenteLider: 2, creadoEn: daysAgo(400) },
      { id: 2, nombre: 'Ingeniería de Software y Calidad', descripcion: 'Arquitecturas limpias, pruebas automatizadas y calidad en sistemas de información.', idFacultad: 1, idDocenteLider: 3, creadoEn: daysAgo(380) },
      { id: 3, nombre: 'Derecho, Tecnología y Sociedad', descripcion: 'Impacto jurídico de la inteligencia artificial, protección de datos y justicia digital.', idFacultad: 2, idDocenteLider: 4, creadoEn: daysAgo(350) },
      { id: 4, nombre: 'Salud Pública y Comunidad', descripcion: 'Acceso a la salud, promoción y prevención en poblaciones rurales y vulnerables.', idFacultad: 3, idDocenteLider: 5, creadoEn: daysAgo(330) },
      { id: 5, nombre: 'Finanzas Sostenibles', descripcion: 'Inversión responsable, finanzas verdes y contabilidad ambiental para pymes.', idFacultad: 4, idDocenteLider: 6, creadoEn: daysAgo(300) },
    ],
    integrantes: [],
    seguimientos: [
      { idUsuario: 12, idSemillero: 1 },
      { idUsuario: 12, idSemillero: 3 },
      { idUsuario: 7, idSemillero: 2 },
    ],
    proyectos: [
      { id: 1, idSemillero: 1, nombre: 'Modelo predictivo de deserción estudiantil', descripcion: 'Identifica señales tempranas de abandono académico con datos institucionales.', estado: 'activo', esPublico: true, fechaInicio: daysAgo(210) },
      { id: 2, idSemillero: 1, nombre: 'Clasificación de imágenes médicas con redes convolucionales', descripcion: 'Evalúa arquitecturas ligeras para apoyo al diagnóstico por imágenes.', estado: 'activo', esPublico: false, fechaInicio: daysAgo(120) },
      { id: 3, idSemillero: 2, nombre: 'Plataforma de pruebas automatizadas para trazabilidad', descripcion: 'Integra pruebas continuas con la trazabilidad de requisitos.', estado: 'activo', esPublico: true, fechaInicio: daysAgo(160) },
      { id: 4, idSemillero: 2, nombre: 'Arquitecturas limpias en sistemas académicos', descripcion: 'Guía de buenas prácticas para sistemas de información universitarios.', estado: 'finalizado', esPublico: true, fechaInicio: daysAgo(400) },
      { id: 5, idSemillero: 3, nombre: 'Inteligencia artificial y debido proceso', descripcion: 'Analiza garantías procesales en decisiones asistidas por algoritmos.', estado: 'activo', esPublico: true, fechaInicio: daysAgo(150) },
      { id: 6, idSemillero: 4, nombre: 'Brechas de acceso a salud en zonas rurales', descripcion: 'Caracteriza barreras de acceso y propone rutas de atención.', estado: 'activo', esPublico: true, fechaInicio: daysAgo(180) },
      { id: 7, idSemillero: 5, nombre: 'Finanzas verdes en pymes', descripcion: 'Modelo de adopción de instrumentos de financiación sostenible.', estado: 'en_pausa', esPublico: false, fechaInicio: daysAgo(240) },
    ],
    avances: [
      { id: 1, idProyecto: 1, idAutor: 2, descripcion: 'Se consolidó el conjunto de datos de cinco cohortes y se depuraron variables.', evidencia: { nombre: 'dataset-cohortes.pdf' }, fecha: daysAgo(150) },
      { id: 2, idProyecto: 1, idAutor: 2, descripcion: 'Primer modelo base con ensamble: AUC de 0.83 en validación.', evidencia: { nombre: 'resultados-modelo-base.pdf' }, fecha: daysAgo(70) },
      { id: 3, idProyecto: 1, idAutor: 2, descripcion: 'Análisis de sesgo por programa académico y ajuste de umbrales.', evidencia: null, fecha: daysAgo(12) },
      { id: 4, idProyecto: 2, idAutor: 2, descripcion: 'Preparación del banco de imágenes anonimizadas.', evidencia: { nombre: 'protocolo-anonimizacion.pdf' }, fecha: daysAgo(100) },
      { id: 5, idProyecto: 3, idAutor: 3, descripcion: 'Prototipo del pipeline de integración continua con reportes de cobertura.', evidencia: { nombre: 'pipeline-ci.pdf' }, fecha: daysAgo(55) },
      { id: 6, idProyecto: 3, idAutor: 3, descripcion: 'Matriz de trazabilidad automatizada para 120 requisitos.', evidencia: null, fecha: daysAgo(20) },
      { id: 7, idProyecto: 5, idAutor: 4, descripcion: 'Revisión sistemática de jurisprudencia sobre decisiones automatizadas.', evidencia: { nombre: 'revision-jurisprudencia.pdf' }, fecha: daysAgo(45) },
      { id: 8, idProyecto: 6, idAutor: 5, descripcion: 'Trabajo de campo en tres municipios: 214 encuestas aplicadas.', evidencia: { nombre: 'informe-campo.pdf' }, fecha: daysAgo(35) },
    ],
    tiposLogro: [
      { id: 1, nombre: 'Evento', xp: 20 },
      { id: 2, nombre: 'Publicación', xp: 30 },
      { id: 3, nombre: 'Proyecto', xp: 50 },
      { id: 4, nombre: 'Ponencia', xp: 80 },
      { id: 5, nombre: 'Artículo', xp: 120 },
      { id: 6, nombre: 'Patente', xp: 200 },
    ],
    niveles: [
      { id: 1, nivel: 1, xpMinimo: 0 },
      { id: 2, nivel: 2, xpMinimo: 100 },
      { id: 3, nivel: 3, xpMinimo: 300 },
      { id: 4, nivel: 4, xpMinimo: 700 },
      { id: 5, nivel: 5, xpMinimo: 1500 },
    ],
    insignias: [
      { id: 1, nombre: 'Primer paso', descripcion: 'Obtén tu primer logro aprobado.', ambito: 'usuario', idTipoLogro: null, cantidad: 1, icono: 'medalla' },
      { id: 2, nombre: 'Divulgador', descripcion: 'Presenta 3 ponencias aprobadas.', ambito: 'usuario', idTipoLogro: 4, cantidad: 3, icono: 'trofeo' },
      { id: 3, nombre: 'Autor', descripcion: 'Publica un artículo aprobado.', ambito: 'usuario', idTipoLogro: 5, cantidad: 1, icono: 'libro' },
      { id: 4, nombre: 'Participante activo', descripcion: 'Participa en 5 eventos académicos.', ambito: 'usuario', idTipoLogro: 1, cantidad: 5, icono: 'calendario' },
      { id: 5, nombre: 'Constante', descripcion: 'Acumula 10 logros aprobados.', ambito: 'usuario', idTipoLogro: null, cantidad: 10, icono: 'trofeo' },
      { id: 6, nombre: 'Semillero en marcha', descripcion: 'El semillero acumula 3 logros aprobados.', ambito: 'semillero', idTipoLogro: null, cantidad: 3, icono: 'equipo' },
      { id: 7, nombre: 'Referente académico', descripcion: 'El semillero acumula 3 artículos aprobados.', ambito: 'semillero', idTipoLogro: 5, cantidad: 3, icono: 'libro' },
      { id: 8, nombre: 'Innovador', descripcion: 'El semillero obtiene una patente.', ambito: 'semillero', idTipoLogro: 6, cantidad: 1, icono: 'idea' },
      { id: 9, nombre: 'Comunidad activa', descripcion: 'El semillero participa en 10 eventos.', ambito: 'semillero', idTipoLogro: 1, cantidad: 10, icono: 'calendario' },
    ],
    insigniasUsuario: [],
    insigniasSemillero: [],
    logros: [],
    publicaciones: [],
    interacciones: [],
    notificaciones: [],
    eventos: [
      { id: 1, nombre: 'Encuentro Institucional de Semilleros', descripcion: 'Jornada anual para presentar avances y resultados de los semilleros.', fecha: daysAgo(-14), lugar: 'Auditorio principal', modalidad: 'Presencial', cupos: 150, idCreador: 1 },
      { id: 2, nombre: 'Taller: publicar en revistas indexadas', descripcion: 'Estrategias para estructurar, enviar y dar seguimiento a un manuscrito.', fecha: daysAgo(-6), lugar: 'Plataforma institucional', modalidad: 'Virtual', cupos: 300, idCreador: 1 },
      { id: 3, nombre: 'Simposio de Investigación en Salud', descripcion: 'Conferencias y posters de investigación en salud pública y comunitaria.', fecha: daysAgo(-30), lugar: 'Sede Salud y plataforma virtual', modalidad: 'Híbrida', cupos: 80, idCreador: 1 },
      { id: 4, nombre: 'Feria de Innovación y Patentes', descripcion: 'Exposición de prototipos y orientación para el registro de patentes.', fecha: daysAgo(20), lugar: 'Centro de convenciones', modalidad: 'Presencial', cupos: 120, idCreador: 1 },
    ],
    participaciones: [
      { idEvento: 4, idUsuario: 7, fecha: daysAgo(25) },
      { idEvento: 4, idUsuario: 10, fecha: daysAgo(25) },
      { idEvento: 1, idUsuario: 8, fecha: daysAgo(3) },
    ],
    convocatorias: [
      { id: 1, titulo: 'Convocatoria interna de proyectos 2026-II', descripcion: 'Financiación semilla para proyectos de semilleros con productos verificables.', fechaLimite: daysAgo(-12), idCreador: 1 },
      { id: 2, titulo: 'Jóvenes investigadores 2026', descripcion: 'Vinculación de estudiantes a proyectos de investigación con acompañamiento docente.', fechaLimite: daysAgo(-25), idCreador: 1 },
      { id: 3, titulo: 'Movilidad académica para ponencias', descripcion: 'Apoyo para presentar resultados en congresos nacionales.', fechaLimite: daysAgo(5), idCreador: 1 },
    ],
    postulaciones: [
      { id: 1, idConvocatoria: 1, idUsuario: 8, estado: 'pendiente', fecha: daysAgo(2) },
      { id: 2, idConvocatoria: 2, idUsuario: 10, estado: 'aprobada', fecha: daysAgo(6) },
      { id: 3, idConvocatoria: 3, idUsuario: 13, estado: 'rechazada', fecha: daysAgo(15) },
    ],
  };

  seedIntegrantes(s);
  seedLogros(s);
  seedPublicaciones(s);
  seedNotificaciones(s);

  // Las insignias se otorgan con la misma regla que usa la aprobación de logros.
  s.semilleros.forEach((se) => {
    const autores = new Set(s.logros.filter((l) => l.idSemillero === se.id).map((l) => l.idUsuario));
    autores.forEach((idUsuario) => otorgarInsignias(s, { idUsuario, idSemillero: se.id }));
  });

  return s;
}

function seedIntegrantes(s) {
  const roles = ['Joven investigador', 'Coinvestigador', 'Auxiliar de investigación'];
  const activos = [
    [1, 7], [1, 8], [1, 9],
    [2, 9], [2, 10], [2, 11],
    [3, 13], [3, 14],
    [4, 15], [4, 16],
    [5, 17], [5, 18],
  ];
  activos.forEach(([idSemillero, idUsuario], index) =>
    insert(s.integrantes, { idSemillero, idUsuario, rol: roles[index % roles.length], estado: 'activo', fechaIngreso: daysAgo(180 - index * 5) }),
  );
  insert(s.integrantes, { idSemillero: 1, idUsuario: 12, rol: 'Joven investigador', estado: 'pendiente', fechaIngreso: daysAgo(2) });
}

function seedLogros(s) {
  // [usuario, semillero, tipo, título, estado, proyecto, días atrás, motivo de rechazo]
  const filas = [
    [7, 1, 5, 'Predicción de deserción con modelos de ensamble', 'aprobado', 1, 60],
    [8, 1, 4, 'Ponencia: analítica del aprendizaje en educación superior', 'aprobado', 1, 45],
    [9, 1, 4, 'Ponencia: sesgos en modelos de clasificación', 'aprobado', 2, 30],
    [7, 1, 1, 'Participación en el Encuentro de Semilleros 2025', 'aprobado', null, 100],
    [8, 1, 1, 'Asistencia al Congreso de Ciencia de Datos', 'aprobado', null, 80],
    [9, 1, 3, 'Proyecto interno: tablero de analítica académica', 'aprobado', null, 120],
    [7, 1, 2, 'Capítulo de libro sobre ciencia de datos aplicada', 'registrado', null, 3],
    [9, 1, 1, 'Participación en el taller de publicación científica', 'en_validacion', null, 5],
    [2, 1, 5, 'Artículo: aprendizaje federado en datos educativos', 'en_validacion', 2, 2],
    [8, 1, 2, 'Publicación sin soporte suficiente', 'rechazado', null, 20, 'La evidencia adjunta no permite verificar la autoría.'],
    [10, 2, 5, 'Estrategias de pruebas automatizadas en integración continua', 'aprobado', 3, 70],
    [11, 2, 4, 'Ponencia: calidad de software en entornos académicos', 'aprobado', 3, 40],
    [9, 2, 1, 'Taller de ingeniería de requisitos', 'aprobado', null, 90],
    [10, 2, 6, 'Patente: método de trazabilidad automatizada de pruebas', 'en_validacion', 3, 4],
    [11, 2, 1, 'Foro de calidad de software', 'registrado', null, 1],
    [13, 3, 4, 'Ponencia: inteligencia artificial y debido proceso', 'aprobado', 5, 35],
    [14, 3, 1, 'Seminario de derecho digital', 'aprobado', null, 50],
    [13, 3, 2, 'Artículo de divulgación jurídica', 'aprobado', null, 25],
    [15, 4, 1, 'Jornada de salud pública comunitaria', 'aprobado', null, 40],
    [16, 4, 3, 'Proyecto de extensión comunitaria en salud', 'aprobado', 6, 60],
    [17, 5, 1, 'Foro de finanzas sostenibles', 'aprobado', null, 130],
    [18, 5, 2, 'Nota de divulgación sobre finanzas verdes', 'registrado', null, 120],
  ];

  filas.forEach(([idUsuario, idSemillero, idTipoLogro, titulo, estado, idProyecto, dias, motivoRechazo]) => {
    const resuelto = estado === 'aprobado' || estado === 'rechazado';
    insert(s.logros, {
      idUsuario,
      idSemillero,
      idTipoLogro,
      idProyecto,
      titulo,
      descripcion: 'Soporte cargado por el integrante para su revisión.',
      evidencia: { nombre: `evidencia-${titulo.slice(0, 18).toLowerCase().replace(/\W+/g, '-')}.pdf` },
      estado,
      xpAsignado: estado === 'aprobado' ? s.tiposLogro.find((t) => t.id === idTipoLogro).xp : 0,
      idValidador: resuelto ? 1 : null,
      motivoRechazo: motivoRechazo ?? null,
      fechaRegistro: daysAgo(dias),
      fechaValidacion: resuelto ? daysAgo(Math.max(dias - 2, 0)) : null,
    });
  });
}

function seedPublicaciones(s) {
  // [autor, semillero, categoría, contenido, estado, público, días atrás, evidencia]
  const filas = [
    [7, 1, 'Avance', 'Compartimos los primeros resultados del modelo predictivo de deserción: el ensamble supera al modelo base en todas las cohortes evaluadas.', 'publicada', true, 6, 'resultados-modelo.pdf'],
    [8, 1, 'Evento', 'Presentamos nuestra ponencia sobre analítica del aprendizaje y recibimos valiosa retroalimentación de la comunidad académica.', 'publicada', false, 12, null],
    [2, 1, 'Convocatoria', 'Abrimos cupos para jóvenes investigadores en el semillero. Escríbenos o solicita tu vinculación desde la plataforma.', 'publicada', true, 9, null],
    [10, 2, 'Logro', 'Nuestro artículo sobre pruebas automatizadas fue aprobado y ya hace parte de la producción del semillero.', 'publicada', true, 4, 'articulo-pruebas.pdf'],
    [11, 2, 'Avance', 'Primer borrador de la guía de calidad para sistemas académicos. Esperamos comentarios del equipo.', 'pendiente', false, 1, 'borrador-guia.pdf'],
    [13, 3, 'Divulgación', 'Publicamos una nota sobre las garantías del debido proceso frente a decisiones asistidas por algoritmos.', 'publicada', true, 8, null],
    [15, 4, 'Evento', 'Jornada comunitaria en salud pública: más de 200 personas atendidas con apoyo de estudiantes.', 'publicada', false, 15, 'registro-jornada.pdf'],
    [17, 5, 'Avance', 'Resultados preliminares sobre adopción de bonos verdes en pymes del sector manufacturero.', 'publicada', false, 115, null],
    [4, 3, 'Evento', 'Invitamos al conversatorio sobre derecho, tecnología y sociedad. Entrada libre para la comunidad universitaria.', 'publicada', true, 3, null],
  ];

  filas.forEach(([idUsuario, idSemillero, categoria, contenido, estado, esPublico, dias, evidencia]) =>
    insert(s.publicaciones, {
      idUsuario,
      idSemillero,
      categoria,
      contenido,
      estado,
      esPublico,
      evidencia: evidencia ? { nombre: evidencia } : null,
      fecha: daysAgo(dias),
    }),
  );

  const comentarios = [
    [1, 2, 'Excelentes resultados, felicitaciones al equipo.'],
    [1, 9, 'Me gustaría conocer más sobre el análisis de sesgo.'],
    [4, 3, 'Gran logro para el semillero.'],
    [6, 14, 'Muy pertinente para el debate actual.'],
  ];
  const reacciones = [[1, 2], [1, 8], [1, 9], [1, 10], [3, 7], [3, 12], [4, 7], [4, 11], [6, 14], [6, 4], [7, 16], [9, 13], [9, 14]];
  const compartidos = [[1, 12], [4, 7], [9, 15]];

  reacciones.forEach(([idPublicacion, idUsuario]) =>
    insert(s.interacciones, { idPublicacion, idUsuario, tipo: 'reaccion', contenido: null, fecha: daysAgo(2) }),
  );
  comentarios.forEach(([idPublicacion, idUsuario, contenido]) =>
    insert(s.interacciones, { idPublicacion, idUsuario, tipo: 'comentario', contenido, fecha: daysAgo(1) }),
  );
  compartidos.forEach(([idPublicacion, idUsuario]) =>
    insert(s.interacciones, { idPublicacion, idUsuario, tipo: 'compartido', contenido: null, fecha: daysAgo(1) }),
  );
}

function seedNotificaciones(s) {
  const filas = [
    [1, 'cuenta', 'Hay 2 solicitudes de cuenta pendientes de aprobación.', '/app/validaciones', 1],
    [1, 'logro', 'Un logro del Semillero de Ingeniería de Software está en validación.', '/app/validaciones', 4],
    [2, 'vinculacion', 'Mateo Ríos solicitó vincularse a tu semillero.', '/app/validaciones', 2],
    [2, 'logro', 'Camila Rojas registró un logro para tu revisión.', '/app/validaciones', 3],
    [7, 'logro', 'Tu logro "Predicción de deserción..." fue aprobado: +120 XP para el semillero.', '/app/logros', 60],
    [7, 'publicacion', 'Hay una nueva publicación en el Semillero de Ingeniería de Software.', '/app/publicaciones', 4],
    [12, 'vinculacion', 'Tu solicitud de vinculación está pendiente de aprobación del líder.', '/app/semilleros', 2],
    [12, 'convocatoria', 'Nueva convocatoria: Convocatoria interna de proyectos 2026-II.', '/app/eventos', 5],
  ];
  filas.forEach(([idUsuario, tipo, mensaje, ruta, dias], index) =>
    insert(s.notificaciones, { idUsuario, tipo, mensaje, ruta, leida: index > 5, fecha: daysAgo(dias) }),
  );
}

/* ------------------------------------------------------------------ */
/* Estado y persistencia                                                */
/* ------------------------------------------------------------------ */

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
};

let state = load() ?? buildSeed();

/** Persiste el estado actual (se invoca tras cada operación que modifica datos). */
export function commit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Sin almacenamiento disponible la demostración sigue funcionando en memoria.
  }
}

export const getState = () => state;

/** Vuelve a los datos iniciales de demostración. */
export function reset() {
  state = buildSeed();
  commit();
}
