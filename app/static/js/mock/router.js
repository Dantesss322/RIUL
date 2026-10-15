/**
 * Mini enrutador del backend simulado.
 *
 * Los manejadores (handlers/*.js) se escriben como `http.get('/api/semilleros/:id', resolver)`.
 * Este archivo los registra, encuentra el que coincide con la peticion y devuelve su respuesta.
 * No depende de ninguna libreria: funciona en cualquier navegador sin compilar nada.
 */

/** Espera `ms` milisegundos (imita la latencia de la red). */
export const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

/** Respuesta de un manejador: estado HTTP y cuerpo JSON. */
export const HttpResponse = {
  json: (body, init = {}) => ({ body, status: init.status ?? 200 }),
};

/** Crea el registro de un manejador para un metodo HTTP. */
const registrar = (method) => (path, resolver) => {
  const names = [];
  // "/api/semilleros/:id" -> /^\/api\/semilleros\/([^/]+)\/?$/ con names = ["id"]
  const source = path.replace(/:([^/]+)/g, (_match, name) => {
    names.push(name);
    return '([^/]+)';
  });
  return { method, names, pattern: new RegExp(`^${source}/?$`), resolver };
};

export const http = {
  get: registrar('GET'),
  post: registrar('POST'),
  put: registrar('PUT'),
  patch: registrar('PATCH'),
  delete: registrar('DELETE'),
};

/**
 * Busca el primer manejador que coincide (el orden importa: lo especifico va antes que lo generico)
 * y devuelve su respuesta `{ status, body }`.
 */
export async function dispatch(handlers, { method, url, request }) {
  for (const handler of handlers) {
    if (handler.method !== method) continue;

    const match = handler.pattern.exec(url.pathname);
    if (!match) continue;

    const params = Object.fromEntries(handler.names.map((name, index) => [name, decodeURIComponent(match[index + 1])]));
    return handler.resolver({ request, params });
  }
  return { status: 404, body: { success: false, message: 'La ruta solicitada no existe.' } };
}
