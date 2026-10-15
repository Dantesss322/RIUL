/**
 * Dashboard institucional (RF-6.2, RF-6.4): indicadores pensados para tomar decisiones.
 * Cada bloque responde una pregunta de gestion: quien produce, donde falta participacion,
 * que esta estancado y que tan agil es la validacion. Exporta a Excel (CSV) y a PDF (imprimir).
 * El marco (encabezado, totales y tarjetas con su titulo) lo escribe templates/indicadores.html;
 * aqui se escriben las graficas de cada tarjeta.
 */
import { html, mount, barList, cargarMarco, on } from '../core/ui.js';
import { enlazar } from '../core/dom.js';
import { analiticaApi } from '../core/api.js';
import { descargarCsv } from '../core/exportCsv.js';

const ETIQUETAS_RESUMEN = {
  semillerosActivos: 'Semilleros activos',
  publicaciones: 'Publicaciones',
  logrosAprobados: 'Logros aprobados',
  convocatoriasAbiertas: 'Convocatorias abiertas',
};

/** Filas planas [seccion, indicador, valor] para el archivo exportado. */
const aFilas = (d) => [
  ...Object.entries(d.resumen).map(([clave, valor]) => ['Resumen', ETIQUETAS_RESUMEN[clave], valor]),
  ...d.productividadPorFacultad.map((f) => ['Productividad por facultad', f.facultad, `${f.logros} logros / ${f.xp} XP`]),
  ...d.productosPorTipo.map((p) => ['Producción por tipo', p.tipo, p.total]),
  ...d.vinculacionPorFacultad.map((v) => ['Vinculación estudiantil', v.facultad, `${v.tasa}% (${v.vinculados} de ${v.estudiantes})`]),
  ...d.semillerosInactivos.map((s) => ['Semilleros sin actividad', s.nombre, s.diasSinActividad ?? 'Sin registros']),
  ...d.proyectosEstancados.map((p) => ['Proyectos sin avances', p.nombre, `${p.diasSinAvance} días`]),
  ['Validación', 'Logros pendientes', d.validacion.pendientes],
  ['Validación', 'Antigüedad promedio (días)', d.validacion.antiguedadPromedioDias],
  ['Validación', 'Tasa de aprobación (%)', d.validacion.tasaAprobacion],
  ...d.convocatorias.map((c) => ['Convocatorias', c.titulo, `${c.postulaciones} postulaciones / ${c.tasa}% aceptación`]),
  ...d.eventos.map((e) => ['Eventos', e.nombre, `${e.inscritos} de ${e.cupos} cupos (${e.ocupacion}%)`]),
  ...d.impactoPorSemillero.map((i) => ['Impacto comunitario', i.nombre, `${i.interacciones} interacciones en ${i.publicaciones} publicaciones`]),
  ...d.distribucionNiveles.map((n) => ['Distribución de niveles', `${n.nivel} estrellas`, `${n.semilleros} semilleros`]),
];

/** Lista de alertas accionables (semilleros o proyectos sin actividad). */
const alertas = (items, vacio, detalle) =>
  items.length === 0
    ? html`<p class="text-ink-soft">${vacio}</p>`
    : html`<ul class="divide-y divide-line/60">${items.map(
        (i) => html`<li class="flex items-center justify-between gap-3 py-2.5"><span>${i.nombre}</span><span class="shrink-0 text-sm text-warning">${detalle(i)}</span></li>`,
      )}</ul>`;

/** Grafica de cada tarjeta a partir de los indicadores (la clave es el data-region de la plantilla). */
const GRAFICAS = {
  productividad: (d) => barList(d.productividadPorFacultad.map((f) => ({ label: f.facultad, value: f.logros, hint: `${f.xp} XP acumulados` }))),
  produccion: (d) => barList(d.productosPorTipo.map((p) => ({ label: p.tipo, value: p.total }))),
  vinculacion: (d) => barList(d.vinculacionPorFacultad.map((v) => ({ label: v.facultad, value: v.tasa, hint: `${v.vinculados} de ${v.estudiantes} estudiantes en semilleros` })), '%'),
  inactivos: (d) => alertas(d.semillerosInactivos, 'Todos los semilleros registran actividad en los últimos 90 días.', (s) => (s.diasSinActividad ? `${s.diasSinActividad} días` : 'Sin registros')),
  estancados: (d) => alertas(d.proyectosEstancados, 'Los proyectos activos tienen avances recientes.', (p) => `${p.diasSinAvance} días`),
  convocatorias: (d) => barList(d.convocatorias.map((c) => ({ label: c.titulo, value: c.tasa, hint: `${c.postulaciones} postulaciones` })), '%'),
  eventos: (d) => barList(d.eventos.map((e) => ({ label: e.nombre, value: e.ocupacion, hint: `${e.inscritos} de ${e.cupos} cupos` })), '%'),
  impacto: (d) => barList(d.impactoPorSemillero.map((i) => ({ label: i.nombre, value: i.interacciones, hint: `${i.publicaciones} publicaciones` }))),
  niveles: (d) => barList(d.distribucionNiveles.map((n) => ({ label: `${n.nivel} ${n.nivel === 1 ? 'estrella' : 'estrellas'}`, value: n.semilleros }))),
};

export default function iniciar({ root }) {
  let datos = null;

  cargarMarco(root.querySelector('[data-carga]'), () => analiticaApi.indicadores(), (d) => {
    datos = d;
    enlazar(root, { ...d, tasaAprobacion: `${d.validacion.tasaAprobacion}%` });
    Object.entries(GRAFICAS).forEach(([clave, grafica]) => mount(root.querySelector(`[data-region="${clave}"]`), grafica(d)));
  });

  on(root, 'click', '[data-action="pdf"]', () => window.print());
  on(root, 'click', '[data-action="excel"]', () => datos && descargarCsv('indicadores-riul', aFilas(datos)));
}
