/**
 * Gestion de semilleros (RF-2.1, RF-7.1): el administrador crea el semillero y le asigna su lider.
 * El marco y el formulario los escribe templates/admin_semilleros.html.
 */
import { resourceManager } from '../components/resource_manager.js';

export default function iniciar({ root }) {
  resourceManager({
    root: root.querySelector('[data-gestor="semilleros"]'),
    resource: 'semilleros',
    columns: [
      { header: 'Semillero', cell: (fila) => fila.nombre },
      { header: 'Facultad', cell: (fila) => fila.facultad },
      { header: 'Líder', cell: (fila) => fila.docenteLider },
      { header: 'Integrantes', cell: (fila) => fila.totalIntegrantes },
    ],
  });
}
