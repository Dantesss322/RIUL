"""Controlador de publicaciones, reacciones y comentarios."""
from flask import request

from app.schemas.comunidad import ComentarioSchema, CrearPublicacionSchema, EstadoPublicacionSchema
from app.services import publicacion_service
from app.utils.auth import usuario_actual
from app.utils.request import validar
from app.utils.response import ok


def listar():
    filtros = request.args
    return ok(
        publicacion_service.listar(
            usuario_actual(), filtros.get("estado"), filtros.get("categoria"), filtros.get("idSemillero", type=int)
        )
    )


def crear():
    publicacion = publicacion_service.crear(usuario_actual(), validar(CrearPublicacionSchema(), evidencia="opcional"))
    return ok(
        publicacion,
        "Publicación creada correctamente."
        if publicacion["estado"] == "publicada"
        else "Publicación enviada. Se mostrará cuando tu líder la apruebe.",
        201,
    )


def moderar(id_):
    estado = validar(EstadoPublicacionSchema())["estado"]
    publicacion_service.moderar(usuario_actual(), id_, estado)
    return ok(None, "Publicación aprobada." if estado == "publicada" else "Publicación rechazada.")


def reaccionar(id_):
    return ok(publicacion_service.alternar_reaccion(usuario_actual(), id_))


def comentarios(id_):
    return ok(publicacion_service.comentarios(id_))


def comentar(id_):
    publicacion_service.comentar(usuario_actual(), id_, validar(ComentarioSchema())["contenido"])
    return ok(None, "Comentario publicado.", 201)


def compartir(id_):
    publicacion_service.compartir(usuario_actual(), id_)
    return ok(None, "Publicación compartida.", 201)
