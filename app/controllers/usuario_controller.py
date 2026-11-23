"""Controlador de usuarios: administracion de cuentas, perfil propio y hoja de vida."""
from flask import request

from app.schemas.usuario import EstadoUsuarioSchema, PerfilSchema, RolUsuarioSchema
from app.services import usuario_service
from app.utils.auth import usuario_actual
from app.utils.request import validar
from app.utils.response import ok


def listar():
    filtros = request.args
    return ok(usuario_service.listar(filtros.get("estado"), filtros.get("rol"), filtros.get("q", "")))


def estudiantes():
    return ok(usuario_service.estudiantes())


def actualizar_perfil():
    usuario = usuario_service.actualizar_perfil(usuario_actual(), validar(PerfilSchema()))
    return ok(usuario, "Perfil actualizado correctamente.")


def cambiar_estado(id_):
    estado = validar(EstadoUsuarioSchema())["estado"]
    usuario = usuario_service.cambiar_estado(usuario_actual(), id_, estado)
    mensaje = f"Cuenta de {usuario['nombre']} aprobada." if estado == "aprobado" else f"Solicitud de {usuario['nombre']} rechazada."
    return ok(usuario, mensaje)


def cambiar_rol(id_):
    usuario = usuario_service.cambiar_rol(usuario_actual(), id_, validar(RolUsuarioSchema())["rol"])
    return ok(usuario, "Rol actualizado correctamente.")


def hoja_de_vida(id_):
    return ok(usuario_service.hoja_de_vida(usuario_actual(), id_))
