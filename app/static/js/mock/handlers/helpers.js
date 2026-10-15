import { delay, http, HttpResponse } from '../router.js';
import { commit, getState } from '../db.js';
import { byId, insert } from '../domain.js';

/**
 * Utilidades de los manejadores del backend simulado.
 * Reproducen el sobre de respuesta del backend real: { success, message, data }.
 */
const LATENCY_MS = 250;

export const ok = (data = null, message = 'OK', status = 200) =>
  HttpResponse.json({ success: true, message, data }, { status });

export const fail = (message, status = 400, details) =>
  HttpResponse.json({ success: false, message, ...(details && { details }) }, { status });

export const denied = () => fail('No tienes permisos para realizar esta acción.', 403);
export const notFound = (what = 'El recurso') => fail(`${what} no fue encontrado.`, 404);

/** Valida campos obligatorios; devuelve una respuesta 422 o null si todo está completo. */
export function missingFields(body, required) {
  const missing = required.filter((name) => [undefined, null, ''].includes(body[name]));
  return missing.length
    ? fail('Completa los campos obligatorios.', 422, Object.fromEntries(missing.map((name) => [name, [`Falta: ${name}.`]])))
    : null;
}

/** Convierte a número los campos indicados (los formularios envían texto); vacío pasa a null. */
export const toNumbers = (body, names) =>
  Object.fromEntries(
    Object.entries(body).map(([key, value]) => [
      key,
      names.includes(key) ? (value === '' || value == null ? null : Number(value)) : value,
    ]),
  );

/** Lee el cuerpo de la petición sea JSON o multipart (evidencias). */
export async function readBody(request) {
  const type = request.headers.get('Content-Type') ?? '';
  if (!type.includes('multipart')) return (await request.json().catch(() => ({}))) ?? {};

  const entries = [...(await request.formData()).entries()];
  return Object.fromEntries(
    entries.map(([key, value]) => [key, value instanceof File ? { nombre: value.name, tamano: value.size } : value]),
  );
}

/** Usuario dueño del token "mock.<id>" o null. */
function currentUser(request, state) {
  const token = request.headers.get('Authorization')?.split(' ')[1] ?? '';
  const user = byId(state.usuarios, Number(token.replace('mock.', '')));
  return user?.estado === 'aprobado' ? user : null;
}

const wrap = (resolver, { secured, roles }) => async (info) => {
  await delay(LATENCY_MS);
  const state = getState();
  const user = currentUser(info.request, state);

  if (secured && !user) return fail('Debes iniciar sesión para continuar.', 401);
  if (roles && !roles.includes(user.rol)) return denied();

  const response = await resolver({ ...info, state, user });
  if (info.request.method !== 'GET') commit();
  return response;
};

/** Endpoint público (sin autenticación). */
export const open = (resolver) => wrap(resolver, { secured: false });

/** Endpoint protegido; `roles` limita el acceso (RBAC). */
export const secured = (resolver, roles) => wrap(resolver, { secured: true, roles });

/**
 * Genera los endpoints REST estándar de un recurso (equivalente a la capa
 * repository/service/controller genérica del backend real).
 *
 * @param {string} path         Ruta bajo /api (p. ej. "facultades").
 * @param {object} options
 * @param {string}   [options.collection]  Colección del estado (por defecto = path).
 * @param {string[]} [options.required]    Campos obligatorios al crear.
 * @param {string[]} [options.numeric]     Campos que deben convertirse a número.
 * @param {string[]} [options.writeRoles]  Roles que pueden crear, editar y eliminar.
 * @param {boolean}  [options.publicRead]  Lectura sin autenticación.
 * @param {[string, string, string][]} [options.dependents]  [colección, llave foránea, nombre] que impiden eliminar.
 */
export function crud(path, { collection = path, required = [], numeric = [], writeRoles = ['administrador'], publicRead = false, dependents = [] } = {}) {
  const base = `/api/${path}`;
  const read = publicRead ? open : secured;
  const rows = (state) => state[collection];

  return {
    list: http.get(
      base,
      read(({ request, state }) => {
        const filters = [...new URL(request.url).searchParams.entries()];
        return ok(rows(state).filter((row) => filters.every(([key, value]) => String(row[key]) === value)));
      }),
    ),

    get: http.get(
      `${base}/:id`,
      read(({ params, state }) => {
        const row = byId(rows(state), Number(params.id));
        return row ? ok(row) : notFound();
      }),
    ),

    create: http.post(
      base,
      secured(async ({ request, state }) => {
        const body = toNumbers(await readBody(request), numeric);
        return (
          missingFields(body, required) ??
          ok(insert(rows(state), { ...body, creadoEn: new Date().toISOString() }), 'Registro creado correctamente.', 201)
        );
      }, writeRoles),
    ),

    update: http.put(
      `${base}/:id`,
      secured(async ({ request, params, state }) => {
        const row = byId(rows(state), Number(params.id));
        if (!row) return notFound();
        const body = toNumbers(await readBody(request), numeric);
        return missingFields({ ...row, ...body }, required) ?? ok(Object.assign(row, body), 'Cambios guardados correctamente.');
      }, writeRoles),
    ),

    remove: http.delete(
      `${base}/:id`,
      secured(({ params, state }) => {
        const id = Number(params.id);
        const blocker = dependents.find(([table, key]) => state[table].some((row) => row[key] === id));
        if (blocker) return fail(`No se puede eliminar: tiene ${blocker[2]} asociados.`, 409);
        const list = rows(state);
        const index = list.findIndex((row) => row.id === id);
        if (index === -1) return notFound();
        list.splice(index, 1);
        return ok(null, 'Registro eliminado correctamente.');
      }, writeRoles),
    ),
  };
}
