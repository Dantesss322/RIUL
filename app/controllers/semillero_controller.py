"""Controlador de semilleros, integrantes, vinculaciones y seguimiento."""
from flask import request

from app.schemas.semillero_schema import (
    AgregarIntegranteSchema,
    ResolverVinculacionSchema,
    RolIntegranteSchema,
    SemilleroSchema,
    SolicitudVinculacionSchema,
)
from app.services import semillero_service
from app.utils.auth import usuario_actual
from app.utils.request import validar
from app.utils.response import success


def listar():
    solo_propios = request.args.get("mios") == "true"
    return success(semillero_service.listar(usuario_actual(), request.args.get("q", ""), solo_propios))


def detalle(id_):
    return success(semillero_service.detalle(usuario_actual(), id_))


def crear():
    return success(semillero_service.crear(validar(SemilleroSchema())), "Semillero creado correctamente.", 201)


def actualizar(id_):
    return success(semillero_service.actualizar(id_, validar(SemilleroSchema(), parcial=True)), "Cambios guardados correctamente.")


def eliminar(id_):
    semillero_service.eliminar(id_)
    return success(None, "Registro eliminado correctamente.")


def seguir(id_):
    semillero_service.seguir(usuario_actual(), id_)
    return success(None, "Ahora sigues este semillero.")


def dejar_de_seguir(id_):
    semillero_service.dejar_de_seguir(usuario_actual(), id_)
    return success(None, "Dejaste de seguir este semillero.")


def agregar_integrante(id_):
    semillero_service.agregar_integrante(usuario_actual(), id_, validar(AgregarIntegranteSchema()))
    return success(None, "Integrante agregado correctamente.", 201)


def cambiar_rol_integrante(id_):
    semillero_service.cambiar_rol_integrante(usuario_actual(), id_, validar(RolIntegranteSchema())["rol"])
    return success(None, "Rol actualizado correctamente.")


def retirar_integrante(id_):
    semillero_service.retirar_integrante(usuario_actual(), id_)
    return success(None, "Integrante retirado del semillero.")


def listar_vinculaciones():
    return success(semillero_service.listar_vinculaciones(usuario_actual(), request.args.get("estado")))


def solicitar_vinculacion():
    id_semillero = validar(SolicitudVinculacionSchema())["id_semillero"]
    semillero_service.solicitar_vinculacion(usuario_actual(), id_semillero)
    return success(None, "Solicitud enviada. El líder del semillero la revisará.", 201)


def resolver_vinculacion(id_):
    estado = validar(ResolverVinculacionSchema())["estado"]
    semillero_service.resolver_vinculacion(usuario_actual(), id_, estado)
    return success(None, "Solicitud aprobada." if estado == "activo" else "Solicitud rechazada.")
