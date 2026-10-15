/**
 * Capa de acceso a la API: una funcion por operacion del servidor.
 * Ninguna pagina hace peticiones HTTP directamente; todas pasan por aqui.
 */
import { http } from './http.js';
import { toFormData } from './form.js';

/** Fabrica REST para recursos con CRUD estandar. */
export const crud = (resource) => ({
  listar: (params) => http.get(`/${resource}`, { params }),
  obtener: (id) => http.get(`/${resource}/${id}`),
  crear: (values) => http.post(`/${resource}`, values),
  actualizar: (id, values) => http.put(`/${resource}/${id}`, values),
  eliminar: (id) => http.delete(`/${resource}/${id}`),
});

/** Usuarios y autenticacion (RF-1). */
export const authApi = {
  login: (credenciales) => http.post('/auth/login', credenciales),
  registrar: (values) => http.post('/auth/register', values),
};

export const usuariosApi = {
  listar: (params) => http.get('/usuarios', { params }),
  estudiantes: () => http.get('/usuarios/estudiantes'),
  cambiarEstado: (id, estado) => http.patch(`/usuarios/${id}/estado`, { estado }),
  cambiarRol: (id, rol) => http.patch(`/usuarios/${id}/rol`, { rol }),
  actualizarPerfil: (values) => http.put('/usuarios/me', values),
  hojaDeVida: (id) => http.get(`/usuarios/${id}/hoja-vida`),
};

/** Investigacion (RF-2). */
export const semillerosApi = {
  ...crud('semilleros'),
  seguir: (id) => http.post(`/semilleros/${id}/seguimiento`),
  dejarDeSeguir: (id) => http.delete(`/semilleros/${id}/seguimiento`),
  agregarIntegrante: (id, values) => http.post(`/semilleros/${id}/integrantes`, values),
  cambiarRolIntegrante: (idIntegrante, rol) => http.patch(`/integrantes/${idIntegrante}`, { rol }),
  quitarIntegrante: (idIntegrante) => http.delete(`/integrantes/${idIntegrante}`),
};

export const vinculacionesApi = {
  listar: (params) => http.get('/vinculaciones', { params }),
  solicitar: (idSemillero) => http.post('/vinculaciones', { idSemillero }),
  resolver: (id, estado) => http.patch(`/vinculaciones/${id}`, { estado }),
};

export const proyectosApi = {
  ...crud('proyectos'),
  publicarAvance: (id, values) => http.post(`/proyectos/${id}/avances`, toFormData(values)),
};

/** Gamificacion (RF-4). */
export const logrosApi = {
  listar: (params) => http.get('/logros', { params }),
  registrar: (values) => http.post('/logros', toFormData(values)),
  enviarAValidacion: (id) => http.patch(`/logros/${id}/enviar`),
  aprobar: (id) => http.patch(`/logros/${id}/aprobar`),
  rechazar: (id, motivo) => http.patch(`/logros/${id}/rechazar`, { motivo }),
};

export const tiposLogroApi = { listar: () => http.get('/tipos-logro') };

/** Comunidad (RF-3). */
export const publicacionesApi = {
  listar: (params) => http.get('/publicaciones', { params }),
  crear: (values) => http.post('/publicaciones', toFormData(values)),
  resolver: (id, estado) => http.patch(`/publicaciones/${id}/estado`, { estado }),
  reaccionar: (id) => http.post(`/publicaciones/${id}/reaccion`, null, { silent: true }),
  comentarios: (id) => http.get(`/publicaciones/${id}/comentarios`),
  comentar: (id, contenido) => http.post(`/publicaciones/${id}/comentarios`, { contenido }, { silent: true }),
  compartir: (id) => http.post(`/publicaciones/${id}/compartir`, null, { silent: true }),
};

/** Eventos y convocatorias (RF-5). */
export const eventosApi = {
  listar: () => http.get('/eventos'),
  participar: (id) => http.post(`/eventos/${id}/participaciones`),
};

export const convocatoriasApi = {
  listar: () => http.get('/convocatorias'),
  postularse: (id) => http.post(`/convocatorias/${id}/postulaciones`),
};

export const postulacionesApi = {
  listar: (params) => http.get('/postulaciones', { params }),
  resolver: (id, estado) => http.patch(`/postulaciones/${id}`, { estado }),
};

export const notificacionesApi = {
  listar: () => http.get('/notificaciones'),
  conteo: () => http.get('/notificaciones/conteo', { silent: true }),
  marcarLeida: (id) => http.patch(`/notificaciones/${id}/leida`, null, { silent: true }),
  marcarTodasLeidas: () => http.patch('/notificaciones/leidas', null, { silent: true }),
};

/** Analitica (RF-6) y consulta publica (RF-8). */
export const analiticaApi = {
  dashboard: () => http.get('/dashboard'),
  ranking: (tipo) => http.get('/ranking', { params: { tipo } }),
  insignias: () => http.get('/insignias/mias'),
  indicadores: () => http.get('/indicadores'),
};

export const publicoApi = {
  inicio: () => http.get('/public/home'),
  listar: (tipo) => http.get(`/public/${tipo}`),
};

/** Solo con el backend simulado: restablece los datos de demostracion. */
export const mockApi = { restablecer: () => http.post('/mock/reset') };
