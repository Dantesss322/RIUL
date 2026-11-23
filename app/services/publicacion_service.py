"""Publicaciones con aprobacion del lider, interacciones y estadisticas de impacto (RF-3.1 a RF-3.4)."""
from app.repositories.comunidad_repository import InteraccionRepository, PublicacionRepository
from app.repositories.semillero_repository import SemilleroRepository
from app.schemas.base import vista
from app.schemas.comunidad import ComentarioSchema, PublicacionSchema
from app.services.notificacion_service import notificar
from app.services.permisos import es_lider_de, es_miembro_activo, obtener_o_404, semillero_o_404
from app.utils.constantes import ESTUDIANTE
from app.utils.db import transaccional
from app.utils.errors import Prohibido


def _vistas(publicaciones, usuario):
    """Publicaciones con sus contadores de interaccion y si el usuario ya reacciono."""
    ids = [p.id for p in publicaciones]
    conteos = InteraccionRepository.conteos(ids)
    reaccionadas = InteraccionRepository.reaccionadas_por(usuario.id, ids)
    resultado = []
    for p in publicaciones:
        c = conteos.get(p.id, {})
        resultado.append(
            vista(
                PublicacionSchema(),
                p,
                reacciones=c.get("reaccion", 0),
                comentarios=c.get("comentario", 0),
                compartidos=c.get("compartido", 0),
                interacciones=sum(c.values()),
                reaccionado=p.id in reaccionadas,
            )
        )
    return resultado


def _anunciar(publicacion):
    """Avisa a integrantes y seguidores del semillero de una publicacion nueva."""
    notificar(
        SemilleroRepository.audiencia(publicacion.semillero),
        "publicacion",
        f'Nueva publicación en "{publicacion.semillero.nombre}": {publicacion.categoria}.',
        "/app/publicaciones",
        excluir=publicacion.id_usuario,
    )


def listar(usuario, estado=None, categoria=None, id_semillero=None):
    """Feed visible: publicaciones aprobadas mas las propias. Con `estado=pendiente`, las que el usuario debe moderar."""
    if estado == "pendiente":
        if usuario.rol == ESTUDIANTE:
            return []
        publicaciones = PublicacionRepository.pendientes(SemilleroRepository.ids_de(usuario), categoria, id_semillero)
    else:
        publicaciones = PublicacionRepository.feed(usuario.id, categoria, id_semillero)
    return _vistas(publicaciones, usuario)


@transaccional
def crear(usuario, datos):
    """El lider publica directo; las de estudiantes esperan su aprobacion (RNF-1)."""
    semillero = semillero_o_404(datos["id_semillero"])
    es_lider = es_lider_de(usuario, semillero)
    if not es_lider and not es_miembro_activo(usuario, semillero.id):
        raise Prohibido("Solo los integrantes del semillero pueden publicar en su nombre.")

    publicacion = PublicacionRepository.crear(id_usuario=usuario.id, estado="publicada" if es_lider else "pendiente", **datos)
    if es_lider:
        _anunciar(publicacion)
    else:
        notificar(
            [semillero.id_docente_lider],
            "publicacion",
            f"{usuario.nombre} creó una publicación que espera tu aprobación.",
            "/app/validaciones",
        )
    return _vistas([publicacion], usuario)[0]


@transaccional
def moderar(usuario, id_publicacion, estado):
    publicacion = obtener_o_404(PublicacionRepository, id_publicacion, "La publicación")
    if not es_lider_de(usuario, publicacion.semillero):
        raise Prohibido("Solo el líder del semillero puede moderar publicaciones.")

    PublicacionRepository.actualizar(publicacion, {"estado": estado})
    if estado == "publicada":
        _anunciar(publicacion)
    notificar(
        [publicacion.id_usuario],
        "publicacion",
        "Tu publicación fue aprobada y ya es visible."
        if estado == "publicada"
        else "Tu publicación no fue aprobada por el líder del semillero.",
        "/app/publicaciones",
    )


@transaccional
def alternar_reaccion(usuario, id_publicacion):
    """Una reaccion por persona y publicacion: si ya existe se quita, si no se agrega."""
    publicacion = obtener_o_404(PublicacionRepository, id_publicacion, "La publicación")
    previa = InteraccionRepository.reaccion(publicacion.id, usuario.id)
    if previa:
        InteraccionRepository.eliminar(previa)
    else:
        InteraccionRepository.crear(id_publicacion=publicacion.id, id_usuario=usuario.id, tipo="reaccion")
    return {"reaccionado": previa is None}


def comentarios(id_publicacion):
    publicacion = obtener_o_404(PublicacionRepository, id_publicacion, "La publicación")
    return ComentarioSchema(many=True).dump(InteraccionRepository.comentarios(publicacion.id))


@transaccional
def comentar(usuario, id_publicacion, contenido):
    publicacion = obtener_o_404(PublicacionRepository, id_publicacion, "La publicación")
    InteraccionRepository.crear(id_publicacion=publicacion.id, id_usuario=usuario.id, tipo="comentario", contenido=contenido)


@transaccional
def compartir(usuario, id_publicacion):
    publicacion = obtener_o_404(PublicacionRepository, id_publicacion, "La publicación")
    InteraccionRepository.crear(id_publicacion=publicacion.id, id_usuario=usuario.id, tipo="compartido")
