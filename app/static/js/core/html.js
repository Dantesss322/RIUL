/**
 * Plantillas HTML seguras para JavaScript.
 *
 * `html` es una "plantilla etiquetada": escapa automaticamente todo valor interpolado, de modo
 * que un nombre como `<script>` se muestra como texto y no se ejecuta (proteccion contra XSS).
 * El resultado es un objeto `Raw`, que se puede anidar dentro de otra plantilla sin volver a escaparse.
 */
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);

/** HTML ya seguro: no se vuelve a escapar. */
export class Raw {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

/** Marca un texto como HTML de confianza (solo para contenido propio, nunca para datos del usuario). */
export const raw = (value) => new Raw(value);

function render(value) {
  if (value instanceof Raw) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  if (value == null || value === false) return '';
  return escapeHtml(value);
}

/** html`<p>${nombre}</p>` -> Raw con `nombre` escapado. Acepta arreglos y otros `Raw`. */
export function html(strings, ...values) {
  return new Raw(strings.reduce((out, text, index) => out + text + (index < values.length ? render(values[index]) : ''), ''));
}

/** Dibuja un `Raw` (o texto) dentro de un elemento. */
export function mount(element, content) {
  element.innerHTML = render(content);
}

/** Delegacion de eventos: ejecuta `handler(elemento, evento)` cuando el clic ocurre dentro de `selector`. */
export function on(root, type, selector, handler) {
  root.addEventListener(type, (event) => {
    const target = event.target.closest(selector);
    if (target && root.contains(target)) handler(target, event);
  });
}
