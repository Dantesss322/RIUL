"""Controlador de autenticacion y registro."""
from app.schemas.usuario import LoginSchema, RegistroSchema
from app.services import auth_service
from app.utils.auth import usuario_actual
from app.utils.request import validar
from app.utils.response import ok


def login():
    datos = validar(LoginSchema())
    sesion = auth_service.iniciar_sesion(datos["correo"], datos["password"])
    return ok(sesion, f"Bienvenido, {sesion['user']['nombre'].split()[0]}")


def registrar():
    resultado = auth_service.registrar(validar(RegistroSchema()))
    return ok(resultado, "Solicitud enviada. Te daremos acceso cuando un administrador la apruebe.", 201)


def perfil():
    return ok(auth_service.perfil(usuario_actual()))
