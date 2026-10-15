/**
 * Cliente HTTP unico de la aplicacion y politica central de retroalimentacion.
 *
 * El backend responde siempre con el sobre { success, message, data }. Aqui se:
 *  - agrega el JWT a cada peticion,
 *  - desempaqueta `data` para que las llamadas devuelvan solo la informacion,
 *  - muestra el mensaje de exito de las operaciones que modifican datos,
 *  - clasifica los fallos: 4xx = advertencia (lo corrige la persona), 5xx o red = error del sistema.
 *
 * Opcion por peticion: { silent: true } suprime las alertas (consultas en segundo plano).
 *
 * Con `use_mocks` activo (meta `riul-mocks`), las peticiones no salen a la red: las atiende el
 * backend simulado de js/mock. Al construir el backend real basta con poner USE_MOCKS=false en .env.
 */
import { session } from './session.js';
import { notify } from './notify.js';

const usarSimulacion = document.querySelector('meta[name="riul-mocks"]')?.content === 'true';
const adapter = usarSimulacion ? (await import('../mock/adapter.js')).adapter : undefined;

export const http = axios.create({ baseURL: '/api', adapter });

http.interceptors.request.use((config) => {
  const token = session.get()?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const SERVIDOR_CAIDO = 'No pudimos comunicarnos con el servidor. Intenta de nuevo en unos minutos.';

/** Une el mensaje principal con el detalle de validacion (campo: [mensajes]). */
function describir(data) {
  const detalles = Object.values(data?.details ?? {}).flat();
  return [data?.message, ...detalles].filter(Boolean).join('\n');
}

http.interceptors.response.use(
  (response) => {
    const { data, message } = response.data;
    const modifica = response.config.method !== 'get';
    if (modifica && message && !response.config.silent) notify.success(message);
    return data;
  },
  (error) => {
    const { response, config } = error;

    if (response?.status === 401 && session.get()) {
      // Token vencido o invalido: se cierra la sesion y se vuelve al ingreso.
      session.clear();
      notify.warning('Tu sesión expiró. Inicia sesión nuevamente.', 'Sesión finalizada').then(() => {
        window.location.assign('/login');
      });
    } else if (!config?.silent) {
      if (response && response.status < 500) notify.warning(describir(response.data));
      else notify.error(response ? describir(response.data) || SERVIDOR_CAIDO : SERVIDOR_CAIDO);
    }

    return Promise.reject(error);
  },
);

export { usarSimulacion };
