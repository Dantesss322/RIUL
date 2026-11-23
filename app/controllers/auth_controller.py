"""Controlador de autenticacion y registro."""
from app.schemas.usuario_schema import LoginSchema, RegistroSchema
from app.services import auth_service
from app.utils.auth import usuario_actual
from app.utils.request import validar
from app.utils.response import success


def login():
    datos = validar(LoginSchema())
    sesion = auth_service.iniciar_sesion(datos["correo"], datos["password"])
    return success(sesion, f"Bienvenido, {sesion['user']['nombre'].split()[0]}")


def registrar():
    resultado = auth_service.registrar(validar(RegistroSchema()))
    return success(resultado, "Solicitud enviada. Te daremos acceso cuando un administrador la apruebe.", 201)


def perfil():
    return success(auth_service.perfil(usuario_actual()))
