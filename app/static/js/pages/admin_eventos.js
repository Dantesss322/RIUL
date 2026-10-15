/** Eventos y convocatorias institucionales (RF-5.1, RF-5.3): los publica el administrador. */
import { html, mount, badge, on, pageHeader, tabs } from '../core/ui.js';
import { resourceManager } from '../components/resource_manager.js';
import { MODALIDADES, toOptions } from '../core/dominio.js';
import { formatDate } from '../core/format.js';

const SECCIONES = {
  eventos: {
    resource: 'eventos',
    title: 'Eventos institucionales',
    noun: 'evento',
    columns: [
      { header: 'Evento', cell: (fila) => fila.nombre },
      { header: 'Fecha', cell: (fila) => formatDate(fila.fecha) },
      { header: 'Modalidad', cell: (fila) => fila.modalidad },
      { header: 'Inscritos', cell: (fila) => `${fila.inscritos} / ${fila.cupos}` },
    ],
    fields: [
      { name: 'nombre', label: 'Nombre del evento', required: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
      { name: 'fecha', label: 'Fecha', type: 'date', required: true },
      { name: 'lugar', label: 'Lugar', required: true },
      { name: 'modalidad', label: 'Modalidad', type: 'select', options: toOptions(MODALIDADES), required: true },
      { name: 'cupos', label: 'Cupos', type: 'number', min: 1, required: true },
    ],
  },
  convocatorias: {
    resource: 'convocatorias',
    title: 'Convocatorias',
    noun: 'convocatoria',
    columns: [
      { header: 'Convocatoria', cell: (fila) => fila.titulo },
      { header: 'Cierre', cell: (fila) => formatDate(fila.fechaLimite) },
      { header: 'Estado', cell: (fila) => badge(fila.abierta ? 'success' : 'neutral', fila.abierta ? 'Abierta' : 'Cerrada') },
    ],
    fields: [
      { name: 'titulo', label: 'Título', required: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
      { name: 'fechaLimite', label: 'Fecha límite', type: 'date', required: true },
    ],
  },
};

export default function iniciar({ root }) {
  let pestana = 'eventos';

  const dibujar = () => {
    mount(
      root,
      html`${pageHeader({ title: 'Eventos y convocatorias', description: 'Publica las oportunidades y actividades de la red de investigación.' })}
        <div class="mb-4">${tabs([{ id: 'eventos', label: 'Eventos' }, { id: 'convocatorias', label: 'Convocatorias' }], pestana)}</div>
        <div id="gestor"></div>`,
    );
    resourceManager({ root: root.querySelector('#gestor'), ...SECCIONES[pestana] });
  };

  on(root, 'click', '[data-tab]', (tab) => {
    pestana = tab.dataset.tab;
    dibujar();
  });

  dibujar();
}
