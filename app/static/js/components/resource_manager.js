/**
 * Gestor CRUD generico para los catalogos del panel de administracion.
 * Se configura declarando columnas y campos; la tabla, el modal de edicion, la confirmacion de
 * borrado y las alertas son compartidos (RF-7.1).
 *
 * resource: recurso REST (facultades, programas...).   noun: nombre singular para los textos.
 * columns:  [{ header, cell: (fila) => Raw|texto }]
 * fields:   [{ name, label, type?, required?, options?, min?, max?, placeholder?,
 *              optionsFrom?: { resource, params?, label? } }]
 */
import { html, mount, button, card, cargar, dataTable, emptyState, field, formModal, intentar, on } from '../core/ui.js';
import { crud } from '../core/api.js';
import { notify } from '../core/notify.js';

/** Los <input type="date"> solo aceptan "AAAA-MM-DD"; el backend entrega fechas ISO completas. */
const valorDeEntrada = (campo, valor) => (campo.type === 'date' && valor ? String(valor).slice(0, 10) : (valor ?? ''));

/** Opciones de los campos que se alimentan de otro recurso del backend. */
async function resolverOpciones(fields) {
  const resueltos = await Promise.all(
    fields.map(async (campo) => {
      if (!campo.optionsFrom) return campo;
      const { resource, params, label = 'nombre' } = campo.optionsFrom;
      const filas = (await intentar(() => crud(resource).listar(params))) ?? [];
      return { ...campo, options: filas.map((fila) => ({ value: fila.id, label: fila[label] })) };
    }),
  );
  return resueltos;
}

export function resourceManager({ root, resource, title, noun, columns, fields }) {
  const api = crud(resource);
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

  mount(
    root,
    card(
      { title, action: button({ size: 'sm', icon: 'add-line', children: 'Nuevo', 'data-nuevo': true }) },
      html`<div data-tabla></div>`,
    ),
  );
  const tabla = root.querySelector('[data-tabla]');

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
    const campos = await resolverOpciones(fields);
    formModal({
      title: registro.id ? `Editar ${noun}` : `Agregar ${noun}`,
      body: html`${campos.map((campo) =>
        field({
          label: campo.label,
          name: campo.name,
          type: campo.type ?? 'text',
          options: campo.options,
          placeholder: campo.placeholder,
          value: valorDeEntrada(campo, registro[campo.name]),
          required: campo.required,
          min: campo.min,
          max: campo.max,
        }),
      )}`,
      onSubmit: async (values) => {
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
}
