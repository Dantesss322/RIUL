/** Reglas de gamificacion (RF-4.3 a RF-4.5): XP por tipo de logro, niveles e insignias, sin tocar codigo. */
import { html, mount, insigniaIcon, on, pageHeader, tabs } from '../core/ui.js';
import { resourceManager } from '../components/resource_manager.js';
import { ICONOS_INSIGNIA, toOptions } from '../core/dominio.js';

const AMBITOS = [
  { value: 'usuario', label: 'Estudiante' },
  { value: 'semillero', label: 'Semillero' },
];

const SECCIONES = {
  tipos: {
    resource: 'tipos-logro',
    title: 'Tipos de logro y XP',
    noun: 'tipo de logro',
    columns: [
      { header: 'Tipo', cell: (fila) => fila.nombre },
      { header: 'XP que otorga', cell: (fila) => fila.xp },
    ],
    fields: [
      { name: 'nombre', label: 'Nombre', required: true },
      { name: 'xp', label: 'XP que otorga', type: 'number', min: 1, required: true },
    ],
  },
  niveles: {
    resource: 'niveles',
    title: 'Niveles (estrellas)',
    noun: 'nivel',
    columns: [
      { header: 'Nivel', cell: (fila) => `${fila.nivel} ${fila.nivel === 1 ? 'estrella' : 'estrellas'}` },
      { header: 'XP mínimo', cell: (fila) => fila.xpMinimo },
    ],
    fields: [
      { name: 'nivel', label: 'Número de estrellas', type: 'number', min: 1, max: 5, required: true },
      { name: 'xpMinimo', label: 'XP mínimo para alcanzarlo', type: 'number', min: 0, required: true },
    ],
  },
  insignias: {
    resource: 'insignias',
    title: 'Insignias y reglas',
    noun: 'insignia',
    columns: [
      { header: 'Insignia', cell: (fila) => html`<span class="flex items-center gap-2">${insigniaIcon(fila.icono, 18)} ${fila.nombre}</span>` },
      { header: 'Aplica a', cell: (fila) => AMBITOS.find((a) => a.value === fila.ambito)?.label },
      {
        header: 'Regla',
        cell: (fila) => `${fila.cantidad} logro${fila.cantidad === 1 ? '' : 's'}${fila.idTipoLogro ? ' del tipo indicado' : ' de cualquier tipo'}`,
      },
    ],
    fields: [
      { name: 'nombre', label: 'Nombre', required: true },
      { name: 'descripcion', label: 'Descripción', required: true },
      { name: 'ambito', label: 'Aplica a', type: 'select', options: AMBITOS, required: true },
      { name: 'idTipoLogro', label: 'Tipo de logro requerido', type: 'select', placeholder: 'Cualquier tipo', optionsFrom: { resource: 'tipos-logro' } },
      { name: 'cantidad', label: 'Cantidad de logros aprobados', type: 'number', min: 1, required: true },
      { name: 'icono', label: 'Icono', type: 'select', options: toOptions(ICONOS_INSIGNIA), required: true },
    ],
  },
};

export default function iniciar({ root }) {
  let pestana = 'tipos';

  const dibujar = () => {
    mount(
      root,
      html`${pageHeader({ title: 'Reglas de gamificación', description: 'Define cuánto XP otorga cada logro, cuándo se sube de nivel y qué insignias existen.' })}
        <div class="mb-4">${tabs([{ id: 'tipos', label: 'Tipos de logro' }, { id: 'niveles', label: 'Niveles' }, { id: 'insignias', label: 'Insignias' }], pestana)}</div>
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
