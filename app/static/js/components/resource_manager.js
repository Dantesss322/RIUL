/**
 * Gestor CRUD generico para los catalogos del panel de administracion (RF-7.1).
 *
 * El marco vive en la plantilla (macro `gestor` de partials/_ui.html): un panel [data-gestor="recurso"]
 * con el titulo, el boton "Nuevo" y la region de la tabla, mas un <template data-modal="recurso"> con
 * el formulario. Aqui solo se declaran las columnas; la tabla, el modal de edicion, la confirmacion
 * de borrado y las alertas son compartidos.
 *
 * Los <select> del formulario que se alimentan de otro recurso llevan data-options="recurso" o
 * data-options="recurso?parametro=valor"; su etiqueta es el campo `nombre`.
 */
import { html, mount, cargar, dataTable, emptyState, button, intentar, on } from '../core/ui.js';
import { formModal, iniciarTabs, llenarSelect, modalDe } from '../core/dom.js';
import { crud } from '../core/api.js';
import { notify } from '../core/notify.js';

/** Los <input type="date"> solo aceptan "AAAA-MM-DD"; el backend entrega fechas ISO completas. */
const valorDeEntrada = (control, valor) => (control.type === 'date' && valor ? String(valor).slice(0, 10) : (valor ?? ''));

/** Opciones de cada <select data-options> del formulario, pedidas al backend: { nombreDelCampo: [{value, label}] }. */
async function resolverOpciones(plantillaForm) {
  const selects = [...plantillaForm.content.querySelectorAll('select[data-options]')];
  const entradas = await Promise.all(
    selects.map(async (select) => {
      const [resource, consulta = ''] = select.dataset.options.split('?');
      const filas = (await intentar(() => crud(resource).listar(Object.fromEntries(new URLSearchParams(consulta))))) ?? [];
      return [select.name, filas.map((fila) => ({ value: fila.id, label: fila.nombre }))];
    }),
  );
  return Object.fromEntries(entradas);
}

/**
 * @param {object} options
 * @param {HTMLElement} options.root       Panel [data-gestor] del recurso.
 * @param {string} options.resource        Recurso REST (facultades, programas...).
 * @param {{header: string, cell: (fila) => *}[]} options.columns
 * @returns {{recargar: () => void}}
 */
export function resourceManager({ root, resource, columns }) {
  const api = crud(resource);
  const noun = root.dataset.sustantivo;
  const tabla = root.querySelector('[data-region="tabla"]');
  const plantillaForm = modalDe(resource);
  let filas = [];

  const acciones = {
    header: 'Acciones',
    className: 'w-28 text-right',
    cell: (fila) =>
      html`<div class="flex justify-end gap-1">
        ${button({ variant: 'ghost', size: 'sm', icon: 'edit-line', 'aria-label': `Editar ${noun}`, 'data-edit': fila.id })}
        ${button({ variant: 'ghost', size: 'sm', icon: 'delete-bin-line', 'aria-label': `Eliminar ${noun}`, 'data-delete': fila.id })}
      </div>`,
  };

  const recargar = () =>
    cargar(tabla, () => api.listar(), (datos) => {
      filas = datos;
      mount(
        tabla,
        datos.length === 0
          ? emptyState({ icon: 'inbox-line', title: 'Aún no hay registros', description: `Usa "Nuevo" para agregar ${noun}.` })
          : dataTable([...columns, acciones], datos),
      );
    });

  /** Abre el formulario de creacion (`registro` vacio) o de edicion. */
  async function abrirFormulario(registro = {}) {
    const opciones = await resolverOpciones(plantillaForm);
    formModal(plantillaForm, {
      titulo: registro.id ? `Editar ${noun}` : `Agregar ${noun}`,
      alAbrir: (form) => {
        Object.entries(opciones).forEach(([campo, items]) => llenarSelect(form.elements[campo], items));
        [...form.elements].forEach((control) => {
          if (control.name && registro[control.name] != null) control.value = valorDeEntrada(control, registro[control.name]);
        });
      },
      alEnviar: async (values) => {
        await (registro.id ? api.actualizar(registro.id, values) : api.crear(values));
        recargar();
        return true;
      },
    });
  }

  on(root, 'click', '[data-nuevo]', () => abrirFormulario());
  on(root, 'click', '[data-edit]', (boton) => abrirFormulario(filas.find((fila) => String(fila.id) === boton.dataset.edit)));
  on(root, 'click', '[data-delete]', async (boton) => {
    const acepta = await notify.confirm({
      title: `¿Eliminar ${noun}?`,
      text: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!acepta) return;
    await intentar(() => api.eliminar(boton.dataset.delete));
    recargar();
  });

  recargar();
  return { recargar };
}

/**
 * Pantalla con pestanas donde cada pestana es un gestor: crea el gestor al abrir su panel por primera
 * vez y lo recarga cuando se vuelve a el.
 * @param {HTMLElement} root
 * @param {Record<string, {header: string, cell: (fila) => *}[]>} columnasPorRecurso
 */
export function gestoresConPestanas(root, columnasPorRecurso) {
  const gestores = {};
  iniciarTabs(root, {
    alCambiar: (id) => {
      if (gestores[id]) gestores[id].recargar();
      else gestores[id] = resourceManager({ root: root.querySelector(`[data-gestor="${id}"]`), resource: id, columns: columnasPorRecurso[id] });
    },
  });
}
