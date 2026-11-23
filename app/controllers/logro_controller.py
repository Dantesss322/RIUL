"""Controlador de logros."""
from flask import request

from app.schemas.gamificacion import RechazarLogroSchema, RegistrarLogroSchema
from app.services import logro_service
from app.utils.auth import usuario_actual
from app.utils.request import validar
from app.utils.response import ok


def listar():
    solo_propios = request.args.get("mios") == "true"
    return ok(logro_service.listar(usuario_actual(), request.args.get("estado"), solo_propios))


def registrar():
    logro = logro_service.registrar(usuario_actual(), validar(RegistrarLogroSchema(), evidencia="requerida"))
    lo_envia_el_lider = logro["estado"] == "en_validacion"
    return ok(
        logro,
        "Logro enviado a validación del administrador."
        if lo_envia_el_lider
        else "Logro registrado. Tu líder lo revisará y lo enviará a validación.",
        201,
    )


def enviar(id_):
    logro_service.enviar_a_validacion(usuario_actual(), id_)
    return ok(None, "Logro enviado a validación del administrador.")


def aprobar(id_):
    logro, mensaje = logro_service.aprobar(usuario_actual(), id_)
    return ok(logro, mensaje)


def rechazar(id_):
    logro_service.rechazar(usuario_actual(), id_, validar(RechazarLogroSchema())["motivo"])
    return ok(None, "Logro rechazado. Se notificó al autor.")
