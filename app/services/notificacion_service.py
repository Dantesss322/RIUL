"""Notificaciones por usuario (RF-3.2). El frontend las consulta cada 30 segundos."""
from app.repositories.comunidad_repository import NotificacionRepository
from app.schemas.comunidad_schema import NotificacionSchema
from app.services.permisos import obtener_o_404
from app.utils.db import transaccional
from app.utils.errors import NoEncontrado


def notificar(destinatarios, tipo, mensaje, ruta, excluir=None):
    """Crea una notificacion por destinatario, sin repetir ni avisar a quien origina el hecho.

    No confirma la transaccion: forma parte de la operacion que la invoca.
    """
    ids = sorted(set(destinatarios) - {excluir})
    NotificacionRepository.agregar(ids, tipo, mensaje, ruta)


def listar(usuario):
    return NotificacionSchema(many=True).dump(NotificacionRepository.de_usuario(usuario.id))


def conteo(usuario):
    return {"noLeidas": NotificacionRepository.contar_no_leidas(usuario.id)}


@transaccional
def marcar_leida(usuario, id_notificacion):
    notificacion = obtener_o_404(NotificacionRepository, id_notificacion, "La notificación")
    if notificacion.id_usuario != usuario.id:
        raise NoEncontrado("La notificación")
    notificacion.leida = True


@transaccional
def marcar_todas_leidas(usuario):
    NotificacionRepository.marcar_todas_leidas(usuario.id)
