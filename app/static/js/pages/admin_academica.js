/** Facultades y programas (RF-7.1): estructura academica sobre la que se agrupan usuarios y semilleros. */
import { html, mount, on, pageHeader, tabs } from '../core/ui.js';
import { resourceManager } from '../components/resource_manager.js';

const SECCIONES = {
  facultades: {
    resource: 'facultades',
    title: 'Facultades',
    noun: 'facultad',
    columns: [{ header: 'Nombre', cell: (fila) => fila.nombre }],
    fields: [{ name: 'nombre', label: 'Nombre de la facultad', required: true }],
  },
  programas: {
    resource: 'programas',
    title: 'Programas académicos',
    noun: 'programa',
    columns: [
      { header: 'Nombre', cell: (fila) => fila.nombre },
      { header: 'Facultad', cell: (fila) => fila.facultad },
    ],
    fields: [
      { name: 'nombre', label: 'Nombre del programa', required: true },
      { name: 'idFacultad', label: 'Facultad', type: 'select', required: true, optionsFrom: { resource: 'facultades' } },
    ],
  },
};

export default function iniciar({ root }) {
  let pestana = 'facultades';

  const dibujar = () => {
    mount(
      root,
      html`${pageHeader({ title: 'Facultades y programas', description: 'Estructura académica de la universidad.' })}
        <div class="mb-4">${tabs([{ id: 'facultades', label: 'Facultades' }, { id: 'programas', label: 'Programas' }], pestana)}</div>
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
