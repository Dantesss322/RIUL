/**
 * Facultades y programas (RF-7.1): estructura academica sobre la que se agrupan usuarios y semilleros.
 * El marco y los formularios los escribe templates/admin_academica.html.
 */
import { gestoresConPestanas } from '../components/resource_manager.js';

const COLUMNAS = {
  facultades: [{ header: 'Nombre', cell: (fila) => fila.nombre }],
  programas: [
    { header: 'Nombre', cell: (fila) => fila.nombre },
    { header: 'Facultad', cell: (fila) => fila.facultad },
  ],
};

export default function iniciar({ root }) {
  gestoresConPestanas(root, COLUMNAS);
}
