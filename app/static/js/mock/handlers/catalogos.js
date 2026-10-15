import { http } from '../router.js';
import { nameOf } from '../domain.js';
import { crud, ok, open } from './helpers.js';

/**
 * Catálogos administrables (RF-7.1): estructura académica y reglas de gamificación.
 * Cada uno obtiene los cinco endpoints REST estándar. Los tipos de logro viven en logros.js.
 */
const facultades = crud('facultades', {
  required: ['nombre'],
  publicRead: true,
  dependents: [
    ['programas', 'idFacultad', 'programas'],
    ['semilleros', 'idFacultad', 'semilleros'],
  ],
});

const programas = crud('programas', {
  required: ['nombre', 'idFacultad'],
  numeric: ['idFacultad'],
  publicRead: true,
  dependents: [['usuarios', 'idPrograma', 'usuarios']],
});

const niveles = crud('niveles', {
  required: ['nivel', 'xpMinimo'],
  numeric: ['nivel', 'xpMinimo'],
});

const insignias = crud('insignias', {
  required: ['nombre', 'descripcion', 'ambito', 'cantidad', 'icono'],
  numeric: ['idTipoLogro', 'cantidad'],
  dependents: [
    ['insigniasUsuario', 'idInsignia', 'insignias otorgadas'],
    ['insigniasSemillero', 'idInsignia', 'insignias otorgadas'],
  ],
});

export const catalogosHandlers = [
  // El listado de programas incluye el nombre de su facultad (la tabla del administrador lo muestra).
  http.get(
    '/api/programas',
    open(({ state }) => ok(state.programas.map((p) => ({ ...p, facultad: nameOf(state.facultades, p.idFacultad) })))),
  ),
  ...[facultades, programas, niveles, insignias].flatMap(Object.values),
];
