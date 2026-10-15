/**
 * Eventos y convocatorias (RF-2.8, RF-5.2, RF-5.3): registrar participacion y postularse.
 * El encabezado, las pestanas y los paneles los escribe templates/eventos.html.
 */
import { html, mount, badge, button, card, cargar, emptyState, estadoBadge, icon, intentar, on, withLoading } from '../core/ui.js';
import { iniciarTabs } from '../core/dom.js';
import { convocatoriasApi, eventosApi } from '../core/api.js';
import { formatDate, plural } from '../core/format.js';

const tarjetaEvento = (e) => {
  const sinCupos = e.cuposDisponibles === 0;
  return card({}, html`<div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0"><h3 class="text-lg font-semibold tracking-tight">${e.nombre}</h3><p class="mt-1 text-ink-soft">${e.descripcion}</p></div>
      ${badge(e.pasado ? 'neutral' : 'info', e.modalidad)}
    </div>
    <ul class="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-soft">
      <li class="flex items-center gap-2">${icon('calendar-event-line', { size: 16 })} ${formatDate(e.fecha)}</li>
      <li class="flex items-center gap-2">${icon('map-pin-line', { size: 16 })} ${e.lugar}</li>
      <li>${plural(e.cuposDisponibles, 'cupo disponible', 'cupos disponibles')}</li>
    </ul>
    <div class="mt-4">${e.inscrito
      ? badge('success', 'Participación registrada')
      : button({ size: 'sm', disabled: e.pasado || sinCupos, 'data-participar': e.id, children: e.pasado ? 'Evento finalizado' : sinCupos ? 'Sin cupos' : 'Registrar participación' })}</div>`);
};

const tarjetaConvocatoria = (c, puedePostularse) =>
  card({}, html`<h3 class="text-lg font-semibold tracking-tight">${c.titulo}</h3>
    <p class="mt-1 text-ink-soft">${c.descripcion}</p>
    <p class="mt-4 flex items-center gap-2 text-sm text-ink-soft">${icon('time-line', { size: 16 })}
      ${c.abierta ? `Cierra en ${plural(c.diasRestantes, 'día')} · ${formatDate(c.fechaLimite)}` : `Cerró el ${formatDate(c.fechaLimite)}`}</p>
    <div class="mt-4">${c.miPostulacion
      ? estadoBadge(c.miPostulacion)
      : puedePostularse
        ? button({ size: 'sm', disabled: !c.abierta, 'data-postular': c.id, children: c.abierta ? 'Postularse' : 'Convocatoria cerrada' })
        : ''}</div>`);

export default function iniciar({ root, user }) {
  const region = (nombre) => root.querySelector(`[data-region="${nombre}"]`);

  const cargarPanel = (id) => {
    if (id === 'eventos') {
      cargar(region('eventos'), () => eventosApi.listar(), (filas) =>
        mount(region('eventos'), filas.length === 0
          ? card({}, emptyState({ icon: 'calendar-event-line', title: 'No hay eventos programados' }))
          : html`<div class="grid gap-4 md:grid-cols-2">${filas.map(tarjetaEvento)}</div>`));
    } else {
      cargar(region('convocatorias'), () => convocatoriasApi.listar(), (filas) =>
        mount(region('convocatorias'), filas.length === 0
          ? card({}, emptyState({ icon: 'calendar-event-line', title: 'No hay convocatorias publicadas' }))
          : html`<div class="grid gap-4 md:grid-cols-2">${filas.map((c) => tarjetaConvocatoria(c, user.rol === 'estudiante'))}</div>`));
    }
  };

  const tabs = iniciarTabs(root, { alCambiar: cargarPanel });

  on(root, 'click', '[data-participar]', (b) =>
    withLoading(b, () => intentar(async () => {
      await eventosApi.participar(b.dataset.participar);
      cargarPanel(tabs.activa());
    })));

  on(root, 'click', '[data-postular]', (b) =>
    withLoading(b, () => intentar(async () => {
      await convocatoriasApi.postularse(b.dataset.postular);
      cargarPanel(tabs.activa());
    })));
}
