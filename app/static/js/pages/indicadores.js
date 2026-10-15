/**
 * Dashboard institucional (RF-6.2, RF-6.4): indicadores pensados para tomar decisiones.
 * Cada bloque responde una pregunta de gestion: quien produce, donde falta participacion,
 * que esta estancado y que tan agil es la validacion. Exporta a Excel (CSV) y a PDF (imprimir).
 */
import { html, mount, barList, button, card, cargar, on, pageHeader, stat } from '../core/ui.js';
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

const vista = (d) =>
  html`<div class="space-y-6">
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">${Object.entries(d.resumen).map(([clave, valor]) =>
      stat({ label: ETIQUETAS_RESUMEN[clave], value: valor }),
    )}</div>
    <div class="grid gap-6 lg:grid-cols-2">
      ${card({ title: 'Productividad por facultad' }, barList(d.productividadPorFacultad.map((f) => ({ label: f.facultad, value: f.logros, hint: `${f.xp} XP acumulados` }))))}
      ${card({ title: 'Producción por tipo de logro' }, barList(d.productosPorTipo.map((p) => ({ label: p.tipo, value: p.total }))))}
      ${card({ title: 'Vinculación estudiantil por facultad' }, barList(d.vinculacionPorFacultad.map((v) => ({ label: v.facultad, value: v.tasa, hint: `${v.vinculados} de ${v.estudiantes} estudiantes en semilleros` })), '%'))}
      ${card({ title: 'Eficiencia de validación' }, html`<div class="grid grid-cols-3 gap-3 text-center">
        <div><p class="text-3xl font-semibold tabular-nums">${d.validacion.pendientes}</p><p class="text-sm text-ink-soft">Pendientes</p></div>
        <div><p class="text-3xl font-semibold tabular-nums">${d.validacion.antiguedadPromedioDias}</p><p class="text-sm text-ink-soft">Días promedio</p></div>
        <div><p class="text-3xl font-semibold tabular-nums">${d.validacion.tasaAprobacion}%</p><p class="text-sm text-ink-soft">Aprobación</p></div>
      </div>`)}
      ${card({ title: 'Semilleros sin actividad reciente' }, alertas(d.semillerosInactivos, 'Todos los semilleros registran actividad en los últimos 90 días.', (s) => (s.diasSinActividad ? `${s.diasSinActividad} días` : 'Sin registros')))}
      ${card({ title: 'Proyectos activos sin avances' }, alertas(d.proyectosEstancados, 'Los proyectos activos tienen avances recientes.', (p) => `${p.diasSinAvance} días`))}
      ${card({ title: 'Convocatorias: tasa de aceptación' }, barList(d.convocatorias.map((c) => ({ label: c.titulo, value: c.tasa, hint: `${c.postulaciones} postulaciones` })), '%'))}
      ${card({ title: 'Ocupación de eventos' }, barList(d.eventos.map((e) => ({ label: e.nombre, value: e.ocupacion, hint: `${e.inscritos} de ${e.cupos} cupos` })), '%'))}
      ${card({ title: 'Impacto comunitario por semillero' }, barList(d.impactoPorSemillero.map((i) => ({ label: i.nombre, value: i.interacciones, hint: `${i.publicaciones} publicaciones` }))))}
      ${card({ title: 'Distribución de niveles' }, barList(d.distribucionNiveles.map((n) => ({ label: `${n.nivel} ${n.nivel === 1 ? 'estrella' : 'estrellas'}`, value: n.semilleros }))))}
    </div>
  </div>`;

export default function iniciar({ root }) {
  let datos = null;

  mount(
    root,
    html`${pageHeader({
        title: 'Indicadores institucionales',
        description: 'Información para decidir dónde reforzar, reconocer y acompañar a la comunidad investigativa.',
        actions: html`<div class="no-print flex gap-3">
          ${button({ variant: 'secondary', icon: 'printer-line', children: 'Exportar PDF', 'data-action': 'pdf' })}
          ${button({ icon: 'file-excel-2-line', children: 'Exportar Excel', 'data-action': 'excel' })}
        </div>`,
      })}
      <div id="indicadores"></div>`,
  );

  const contenedor = root.querySelector('#indicadores');
  cargar(contenedor, () => analiticaApi.indicadores(), (d) => {
    datos = d;
    mount(contenedor, vista(d));
  });

  on(root, 'click', '[data-action="pdf"]', () => window.print());
  on(root, 'click', '[data-action="excel"]', () => datos && descargarCsv('indicadores-riul', aFilas(datos)));
}
