"""Controlador de notificaciones."""
from app.services import notificacion_service
from app.utils.auth import usuario_actual
from app.utils.response import ok


def listar():
    return ok(notificacion_service.listar(usuario_actual()))


def conteo():
    return ok(notificacion_service.conteo(usuario_actual()))


def marcar_leida(id_):
    notificacion_service.marcar_leida(usuario_actual(), id_)
    return ok(None)


def marcar_todas_leidas():
    notificacion_service.marcar_todas_leidas(usuario_actual())
    return ok(None)
