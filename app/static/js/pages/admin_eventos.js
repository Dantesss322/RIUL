/**
 * Eventos y convocatorias institucionales (RF-5.1, RF-5.3): los publica el administrador.
 * El marco y los formularios los escribe templates/admin_eventos.html.
 */
import { badge } from '../core/ui.js';
import { gestoresConPestanas } from '../components/resource_manager.js';
import { formatDate } from '../core/format.js';

const COLUMNAS = {
  eventos: [
    { header: 'Evento', cell: (fila) => fila.nombre },
    { header: 'Fecha', cell: (fila) => formatDate(fila.fecha) },
    { header: 'Modalidad', cell: (fila) => fila.modalidad },
    { header: 'Inscritos', cell: (fila) => `${fila.inscritos} / ${fila.cupos}` },
  ],
  convocatorias: [
    { header: 'Convocatoria', cell: (fila) => fila.titulo },
    { header: 'Cierre', cell: (fila) => formatDate(fila.fechaLimite) },
    { header: 'Estado', cell: (fila) => badge(fila.abierta ? 'success' : 'neutral', fila.abierta ? 'Abierta' : 'Cerrada') },
  ],
};

export default function iniciar({ root }) {
  gestoresConPestanas(root, COLUMNAS);
}
