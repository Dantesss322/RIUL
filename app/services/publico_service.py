"""Consulta publica (RF-8, RNF-9): solo informacion aprobada y marcada como publica, sin datos personales."""
from app.repositories.comunidad_repository import PublicacionRepository
from app.repositories.evento_repository import EventoRepository
from app.repositories.proyecto_repository import ProyectoRepository
from app.repositories.semillero_repository import SemilleroRepository
from app.services.gamificacion_service import ranking_semilleros
from app.utils.errors import NoEncontrado
from app.utils.fechas import a_iso


def _semilleros():
    """Semilleros por XP, con su nivel (sin nombres de docentes ni de estudiantes)."""
    por_id = {s.id: s for s in SemilleroRepository.listar()}
    return [
        {
            "id": fila["id"],
            "nombre": fila["nombre"],
            "descripcion": por_id[fila["id"]].descripcion,
            "facultad": fila["facultad"],
            "nivel": fila["nivel"],
            "totalIntegrantes": por_id[fila["id"]].total_integrantes,
        }
        for fila in ranking_semilleros()
    ]


def _proyectos():
    return [
        {
            "id": p.id,
            "nombre": p.nombre,
            "descripcion": p.descripcion,
            "estado": p.estado,
            "semillero": p.semillero.nombre,
            "facultad": p.semillero.facultad.nombre,
        }
        for p in ProyectoRepository.publicos()
    ]


def _eventos():
    return [
        {"id": e.id, "nombre": e.nombre, "descripcion": e.descripcion, "fecha": a_iso(e.fecha), "lugar": e.lugar, "modalidad": e.modalidad}
        for e in EventoRepository.proximos()
    ]


LISTADOS = {"semilleros": _semilleros, "proyectos": _proyectos, "eventos": _eventos}


def listar(tipo):
    if tipo not in LISTADOS:
        raise NoEncontrado("La categoría")
    return LISTADOS[tipo]()


def inicio():
    """Totales y destacados para la pagina de inicio."""
    semilleros, proyectos, eventos = _semilleros(), _proyectos(), _eventos()
    return {
        "totales": {"semilleros": len(semilleros), "proyectos": len(proyectos), "eventos": len(eventos)},
        "semilleros": semilleros[:3],
        "proyectos": proyectos[:3],
        "publicaciones": [
            {"id": p.id, "categoria": p.categoria, "contenido": p.contenido, "fecha": a_iso(p.fecha), "semillero": p.semillero.nombre}
            for p in PublicacionRepository.publicas_recientes(3)
        ],
    }
