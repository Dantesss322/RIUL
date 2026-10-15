/**
 * Adaptador de Axios para el backend simulado.
 *
 * Axios permite reemplazar la forma de enviar las peticiones (`adapter`). Este adaptador no sale a la
 * red: entrega la peticion a los manejadores de `handlers/` y responde con lo que ellos devuelvan.
 * Las pantallas no notan la diferencia: siguen llamando a `/api/...` con Axios.
 */
import { dispatch } from './router.js';
import { handlers } from './handlers/index.js';

export async function adapter(config) {
  const url = new URL(axios.getUri(config), window.location.origin);
  const isForm = config.data instanceof FormData;

  const headers = new Headers();
  const authorization = config.headers.get('Authorization');
  if (authorization) headers.set('Authorization', authorization);
  headers.set('Content-Type', isForm ? 'multipart/form-data' : 'application/json');

  // Misma forma que la peticion que recibiria un servidor: url, cabeceras y cuerpo.
  const request = {
    url: url.href,
    method: config.method.toUpperCase(),
    headers,
    json: async () => (typeof config.data === 'string' ? JSON.parse(config.data) : (config.data ?? {})),
    formData: async () => config.data,
  };

  const { status, body } = await dispatch(handlers, { method: request.method, url, request });
  const response = { data: body, status, statusText: '', headers: {}, config, request };

  if (status < 400) return response;
  throw new axios.AxiosError(body?.message ?? 'Error', 'ERR_BAD_REQUEST', config, request, response);
}
