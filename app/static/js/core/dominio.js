/**
 * Vocabulario del dominio RIUL: etiquetas y listas cerradas usadas por la UI.
 * Los valores (claves) coinciden con los ENUM de la base de datos.
 */

export const ROLES = {
  administrador: 'Administrador',
  docente_lider: 'Docente líder',
  estudiante: 'Estudiante investigador',
};

/** Estados y el tono visual con que se muestran (insignia `badge-<tono>` de app.css). */
export const ESTADOS = {
  pendiente: { label: 'Pendiente', tone: 'warning' },
  aprobado: { label: 'Aprobado', tone: 'success' },
  aprobada: { label: 'Aprobada', tone: 'success' },
  rechazado: { label: 'Rechazado', tone: 'danger' },
  rechazada: { label: 'Rechazada', tone: 'danger' },
  registrado: { label: 'Por revisar', tone: 'neutral' },
  en_validacion: { label: 'En validación', tone: 'info' },
  publicada: { label: 'Publicada', tone: 'success' },
  activo: { label: 'Activo', tone: 'success' },
  finalizado: { label: 'Finalizado', tone: 'neutral' },
  en_pausa: { label: 'En pausa', tone: 'warning' },
};

/** Roles dentro de un semillero (listas cerradas de la plantilla semillero_detalle.html). */
export const ROLES_INTEGRANTE = ['Coinvestigador', 'Joven investigador', 'Auxiliar de investigación'];

/** Convierte una lista de valores en opciones de <select>. */
export const toOptions = (values, labels = {}) =>
  values.map((value) => ({ value, label: labels[value]?.label ?? labels[value] ?? value }));
