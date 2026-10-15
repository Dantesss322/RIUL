/**
 * Comportamientos sobre el HTML que ya escribio la plantilla (templates/).
 *
 * Las plantillas declaran el marco con atributos de datos y estos helpers lo activan:
 *   data-roles="a b"    elemento visible solo para esos roles           -> aplicarRoles
 *   data-bind="ruta"    texto tomado de un objeto de datos              -> enlazar
 *   role="tab" + data-panel                                             -> iniciarTabs
 *   <template data-modal="nombre" data-title="..."> formulario de modal -> formModal
 *   <div data-wizard> con secciones data-step                           -> iniciarAsistente
 */
import { escapeHtml, on } from './html.js';
import { intentar, withLoading } from './ui.js';
import { formValues } from './form.js';

/* ------------------------------------------------------------------ */
/* Roles, datos y selects                                              */
/* ------------------------------------------------------------------ */

/** Quita del DOM los elementos con data-roles que no incluyen el rol del usuario. */
export function aplicarRoles(root, rol) {
  root.querySelectorAll('[data-roles]').forEach((elemento) => {
    if (!elemento.dataset.roles.split(' ').includes(rol)) elemento.remove();
  });
}

const valorEn = (datos, ruta) => ruta.split('.').reduce((actual, clave) => actual?.[clave], datos);

/**
 * Escribe en cada [data-bind="ruta"] el valor de `datos` en esa ruta ("totales.usuarios").
 * Las rutas que `datos` no trae se dejan como estan (se puede enlazar por partes).
 * Deja tambien `data-valor` para que el CSS destaque los contadores distintos de cero.
 */
export function enlazar(root, datos) {
  root.querySelectorAll('[data-bind]').forEach((elemento) => {
    const valor = valorEn(datos, elemento.dataset.bind);
    if (valor === undefined) return;
    elemento.textContent = valor ?? '';
    elemento.dataset.valor = valor ?? '';
  });
}

/** Rellena un <select> con opciones [{value, label}], conservando la opcion vacia inicial. */
export function llenarSelect(select, opciones, valor = '') {
  select.querySelectorAll('option:not([value=""])').forEach((opcion) => opcion.remove());
  opciones.forEach((o) => select.append(new Option(o.label, o.value, false, String(o.value) === String(valor))));
}

/** Contenido HTML de un <template data-tpl="nombre"> de la pagina (para piezas repetidas por JS). */
export const plantilla = (nombre) => document.querySelector(`template[data-tpl="${nombre}"]`).innerHTML;

/** <template data-modal="nombre"> con el formulario de un modal (se abre con formModal). */
export const modalDe = (nombre) => document.querySelector(`template[data-modal="${nombre}"]`);

/* ------------------------------------------------------------------ */
/* Pestanas                                                            */
/* ------------------------------------------------------------------ */

/**
 * Activa las pestanas de `root`: botones [role="tab"][data-tab] y paneles [data-panel].
 * `alCambiar(id)` se ejecuta al seleccionar (incluida la pestana inicial).
 */
export function iniciarTabs(root, { alCambiar } = {}) {
  const botones = [...root.querySelectorAll('[role="tablist"] [role="tab"]')];
  const paneles = [...root.querySelectorAll('[data-panel]')];

  const seleccionar = (id) => {
    botones.forEach((boton) => boton.setAttribute('aria-selected', String(boton.dataset.tab === id)));
    paneles.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== id;
    });
    alCambiar?.(id);
  };

  botones.forEach((boton) => boton.addEventListener('click', () => seleccionar(boton.dataset.tab)));
  seleccionar(botones[0].dataset.tab);

  return {
    seleccionar,
    activa: () => botones.find((boton) => boton.getAttribute('aria-selected') === 'true').dataset.tab,
    /** Muestra el numero de pendientes junto al nombre de la pestana (oculto si es cero). */
    contar(id, total) {
      const marca = botones.find((boton) => boton.dataset.tab === id)?.querySelector('[data-count]');
      if (!marca) return;
      marca.textContent = total;
      marca.hidden = !total;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Modales con formulario                                              */
/* ------------------------------------------------------------------ */

/**
 * Abre un modal sobre <dialog> nativo (foco atrapado, cierre con Esc y fondo oscurecido) con el
 * contenido de un <template>. El marco del modal sale de #plantilla-modal (partials/_modal.html).
 * El <dialog> se elimina del DOM al cerrarse.
 */
function abrirModal(contenido, titulo) {
  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.append(document.getElementById('plantilla-modal').content.cloneNode(true));
  dialog.querySelector('[data-modal-titulo]').textContent = titulo;
  dialog.querySelector('[data-modal-cuerpo]').append(contenido.cloneNode(true));
  document.body.append(dialog);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.closest('[data-close]')) cerrarModal(dialog);
  });
  // La tecla Esc cierra el <dialog> de forma nativa: solo falta quitarlo del DOM.
  dialog.addEventListener('close', () => dialog.remove());
  dialog.showModal();
  return dialog;
}

/** Cierra el modal y lo quita del DOM de inmediato (sin esperar al evento `close`). */
function cerrarModal(dialog) {
  dialog.close();
  dialog.remove();
}

/**
 * Modal con el formulario de un <template>. `alAbrir(form)` permite precargar valores y opciones;
 * `alEnviar(values, form)` recibe los datos y, si devuelve algo verdadero, el modal se cierra
 * (los errores ya los notifica el cliente HTTP). Usa la validacion nativa del navegador.
 */
export function formModal(plantillaForm, { titulo = plantillaForm.dataset.title, alAbrir, alEnviar }) {
  const dialog = abrirModal(plantillaForm.content, titulo);
  const form = dialog.querySelector('form');
  alAbrir?.(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const hecho = await withLoading(form.querySelector('[type="submit"]'), () => intentar(() => alEnviar(formValues(form), form)));
    if (hecho) cerrarModal(dialog);
  });
  return dialog;
}

/* ------------------------------------------------------------------ */
/* Asistente por pasos                                                 */
/* ------------------------------------------------------------------ */

/** Valores del formulario del asistente: casillas como booleano y archivos como File (o null). */
function leerValores(form) {
  const valores = {};
  [...form.elements].forEach((campo) => {
    if (!campo.name) return;
    if (campo.type === 'checkbox') valores[campo.name] = campo.checked;
    else if (campo.type === 'file') valores[campo.name] = campo.files[0] ?? null;
    else valores[campo.name] = campo.value;
  });
  return valores;
}

/**
 * Asistente de pasos (RNF-3: los flujos de logros y publicaciones no superan 4 pasos).
 * La plantilla declara las secciones [data-step="Etiqueta"], los botones [data-back] / [data-next] y
 * el texto del ultimo paso en data-envio; aqui solo se muestra un paso a la vez, se valida y se envia.
 *
 * @param {HTMLElement} root  Elemento [data-wizard] con el <form>.
 * @param {object} options
 * @param {((values: object) => boolean)[]} [options.validar]  Validacion de cada paso (por posicion).
 * @param {(values: object, paso: number) => void} [options.alMostrar]  Al entrar a un paso (resumen final).
 * @param {(values: object) => Promise<void>} options.alEnviar  Recibe todos los valores al terminar.
 */
export function iniciarAsistente(root, { validar = [], alMostrar, alEnviar }) {
  const form = root.querySelector('form');
  const pasos = [...form.querySelectorAll('[data-step]')];
  const indicador = root.querySelector('[data-stepper]');
  const atras = form.querySelector('[data-back]');
  const siguiente = form.querySelector('[data-next]');
  const etiquetaFinal = root.dataset.envio;
  let actual = 0;

  const dibujarIndicador = () => {
    indicador.innerHTML = pasos
      .map((paso, i) => {
        const estado = i === actual ? 'step-current' : i < actual ? 'step-done' : '';
        const marca = i < actual ? '<i class="ri-check-line" style="font-size:16px;line-height:1" aria-hidden="true"></i>' : `<span aria-hidden="true">${i + 1}</span>`;
        return `<li ${i === actual ? 'aria-current="step"' : ''} class="step ${estado}">${marca}${escapeHtml(paso.dataset.step)}</li>`;
      })
      .join('');
  };

  const mostrar = () => {
    const valores = leerValores(form);
    pasos.forEach((paso, i) => {
      paso.hidden = i !== actual;
    });
    atras.disabled = actual === 0;
    siguiente.textContent = actual === pasos.length - 1 ? etiquetaFinal : 'Continuar';
    siguiente.disabled = validar[actual] ? !validar[actual](valores) : false;
    dibujarIndicador();
    alMostrar?.(valores, actual);
  };

  const revalidar = () => {
    siguiente.disabled = validar[actual] ? !validar[actual](leerValores(form)) : false;
  };
  form.addEventListener('input', revalidar);
  form.addEventListener('change', revalidar);

  on(form, 'click', '[data-back]', () => {
    actual -= 1;
    mostrar();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (actual < pasos.length - 1) {
      actual += 1;
      mostrar();
      return;
    }
    await withLoading(siguiente, () => alEnviar(leerValores(form)));
  });

  mostrar();
}

