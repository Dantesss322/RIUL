"""Proyectos de investigacion, avances y productos (RF-2.3, RF-2.4, RF-2.5)."""
from app.repositories.gamificacion_repository import LogroRepository
from app.repositories.proyecto_repository import AvanceRepository, ProyectoRepository
from app.repositories.semillero_repository import SemilleroRepository
from app.schemas.base_schema import vista
from app.schemas.gamificacion_schema import LogroSchema
from app.schemas.proyecto_schema import AvanceSchema, ProyectoSchema
from app.services.permisos import es_lider_de, es_miembro_activo, obtener_o_404, semillero_o_404
from app.utils.constantes import ADMINISTRADOR
from app.utils.db import transaccional
from app.utils.errors import Prohibido


def _puede_ver(usuario, proyecto):
    """Administrador, lider e integrantes activos ven todo; el resto, solo los proyectos publicos."""
    return (
        proyecto.es_publico
        or usuario.rol == ADMINISTRADOR
        or es_lider_de(usuario, proyecto.semillero)
        or es_miembro_activo(usuario, proyecto.id_semillero)
    )


def _proyecto_del_lider(usuario, id_proyecto, accion):
    proyecto = obtener_o_404(ProyectoRepository, id_proyecto, "El proyecto")
    if not es_lider_de(usuario, proyecto.semillero):
        raise Prohibido(f"Solo el líder del semillero puede {accion}.")
    return proyecto


def listar(usuario, texto="", estado=None):
    proyectos = ProyectoRepository.buscar(SemilleroRepository.ids_de(usuario), texto, estado)
    return ProyectoSchema(many=True).dump(proyectos)


def detalle(usuario, id_proyecto):
    proyecto = obtener_o_404(ProyectoRepository, id_proyecto, "El proyecto")
    if not _puede_ver(usuario, proyecto):
        raise Prohibido("No tienes permisos para ver este proyecto.")

    return vista(
        ProyectoSchema(),
        proyecto,
        puedeGestionar=es_lider_de(usuario, proyecto.semillero),
        avances=AvanceSchema(many=True).dump(AvanceRepository.de_proyecto(proyecto.id)),
        productos=LogroSchema(many=True).dump(LogroRepository.de_proyecto(proyecto.id)),
    )


@transaccional
def crear(usuario, datos):
    if not es_lider_de(usuario, semillero_o_404(datos["id_semillero"])):
        raise Prohibido("Solo el líder del semillero puede registrar proyectos.")
    return ProyectoSchema().dump(ProyectoRepository.crear(**datos))


@transaccional
def actualizar(usuario, id_proyecto, datos):
    proyecto = _proyecto_del_lider(usuario, id_proyecto, "editar el proyecto")
    return ProyectoSchema().dump(ProyectoRepository.actualizar(proyecto, datos))


@transaccional
def publicar_avance(usuario, id_proyecto, datos):
    proyecto = _proyecto_del_lider(usuario, id_proyecto, "publicar avances")
    AvanceRepository.crear(id_proyecto=proyecto.id, id_autor=usuario.id, **datos)
