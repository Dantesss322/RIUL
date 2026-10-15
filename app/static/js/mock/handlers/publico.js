import { http } from '../router.js';
import { nameOf, progresoDeSemillero, rankingSemilleros } from '../domain.js';
import { notFound, ok, open } from './helpers.js';

/**
 * RF-8 y RNF-9: consulta pública. Solo expone información aprobada y marcada como pública,
 * sin nombres de estudiantes ni docentes ni contenido pendiente de validación.
 */
const semillerosPublicos = (s) =>
  rankingSemilleros(s).map((r) => {
    const se = s.semilleros.find((x) => x.id === r.id);
    return {
      id: se.id,
      nombre: se.nombre,
      descripcion: se.descripcion,
      facultad: r.facultad,
      nivel: progresoDeSemillero(s, se.id).nivel,
      totalIntegrantes: s.integrantes.filter((i) => i.idSemillero === se.id && i.estado === 'activo').length,
    };
  });

const proyectosPublicos = (s) =>
  s.proyectos
    .filter((p) => p.esPublico)
    .map((p) => {
      const se = s.semilleros.find((x) => x.id === p.idSemillero);
      return {
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        estado: p.estado,
        semillero: se.nombre,
        facultad: nameOf(s.facultades, se.idFacultad),
      };
    });

const eventosPublicos = (s) =>
  s.eventos
    .filter((e) => new Date(e.fecha) > new Date())
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map(({ id, nombre, descripcion, fecha, lugar, modalidad }) => ({ id, nombre, descripcion, fecha, lugar, modalidad }));

const LISTADOS = { semilleros: semillerosPublicos, proyectos: proyectosPublicos, eventos: eventosPublicos };

export const publicoHandlers = [
  http.get(
    '/api/public/home',
    open(({ state }) => {
      const semilleros = semillerosPublicos(state);
      const proyectos = proyectosPublicos(state);
      const eventos = eventosPublicos(state);

      return ok({
        totales: { semilleros: semilleros.length, proyectos: proyectos.length, eventos: eventos.length },
        semilleros: semilleros.slice(0, 3),
        proyectos: proyectos.slice(0, 3),
        publicaciones: state.publicaciones
          .filter((p) => p.estado === 'publicada' && p.esPublico)
          .sort((a, b) => b.fecha.localeCompare(a.fecha))
          .slice(0, 3)
          .map((p) => ({
            id: p.id,
            categoria: p.categoria,
            contenido: p.contenido,
            fecha: p.fecha,
            semillero: nameOf(state.semilleros, p.idSemillero),
          })),
      });
    }),
  ),

  http.get(
    '/api/public/:tipo',
    open(({ params, state }) => {
      const listar = LISTADOS[params.tipo];
      return listar ? ok(listar(state)) : notFound('La categoría');
    }),
  ),
];
