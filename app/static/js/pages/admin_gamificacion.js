/**
 * Reglas de gamificacion (RF-4.3 a RF-4.5): XP por tipo de logro, niveles e insignias, sin tocar codigo.
 * El marco y los formularios los escribe templates/admin_gamificacion.html.
 */
import { html, insigniaIcon } from '../core/ui.js';
import { gestoresConPestanas } from '../components/resource_manager.js';

const AMBITOS = { usuario: 'Estudiante', semillero: 'Semillero' };

const COLUMNAS = {
  'tipos-logro': [
    { header: 'Tipo', cell: (fila) => fila.nombre },
    { header: 'XP que otorga', cell: (fila) => fila.xp },
  ],
  niveles: [
    { header: 'Nivel', cell: (fila) => `${fila.nivel} ${fila.nivel === 1 ? 'estrella' : 'estrellas'}` },
    { header: 'XP mínimo', cell: (fila) => fila.xpMinimo },
  ],
  insignias: [
    { header: 'Insignia', cell: (fila) => html`<span class="flex items-center gap-2">${insigniaIcon(fila.icono, 18)} ${fila.nombre}</span>` },
    { header: 'Aplica a', cell: (fila) => AMBITOS[fila.ambito] },
    {
      header: 'Regla',
      cell: (fila) => `${fila.cantidad} logro${fila.cantidad === 1 ? '' : 's'}${fila.idTipoLogro ? ' del tipo indicado' : ' de cualquier tipo'}`,
    },
  ],
};

export default function iniciar({ root }) {
  gestoresConPestanas(root, COLUMNAS);
}
