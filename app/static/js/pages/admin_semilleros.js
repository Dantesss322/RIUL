/** Gestion de semilleros (RF-2.1, RF-7.1): el administrador crea el semillero y le asigna su lider. */
import { html, mount, pageHeader } from '../core/ui.js';
import { resourceManager } from '../components/resource_manager.js';

export default function iniciar({ root }) {
  mount(
    root,
    html`${pageHeader({ title: 'Semilleros', description: 'Crea semilleros y asigna a su docente líder.' })}<div id="gestor"></div>`,
  );

  resourceManager({
    root: root.querySelector('#gestor'),
    resource: 'semilleros',
    title: 'Semilleros registrados',
    noun: 'semillero',
    columns: [
      { header: 'Semillero', cell: (fila) => fila.nombre },
      { header: 'Facultad', cell: (fila) => fila.facultad },
      { header: 'Líder', cell: (fila) => fila.docenteLider },
      { header: 'Integrantes', cell: (fila) => fila.totalIntegrantes },
    ],
    fields: [
      { name: 'nombre', label: 'Nombre del semillero', required: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
      { name: 'idFacultad', label: 'Facultad', type: 'select', required: true, optionsFrom: { resource: 'facultades' } },
      {
        name: 'idDocenteLider',
        label: 'Docente líder',
        type: 'select',
        required: true,
        optionsFrom: { resource: 'usuarios', params: { rol: 'docente_lider', estado: 'aprobado' } },
      },
    ],
  });
}
