"""Schemas de usuarios y autenticacion."""
from marshmallow import fields, validate

from app.models import Programa
from app.schemas.base import BaseSchema, Entero, FechaHora, Texto, VaciosComoNulos, existe, opcion
from app.utils.constantes import ROLES


class Clave(VaciosComoNulos, fields.String):
    """Contrasena: no se recorta, para respetar exactamente lo que escribio la persona."""


class UsuarioSchema(BaseSchema):
    """Forma publica de un usuario (nunca incluye la contrasena)."""

    id = fields.Integer()
    nombre = fields.String()
    correo = fields.String()
    rol = fields.String()
    estado = fields.String()
    id_programa = fields.Integer()
    justificacion = fields.String()
    telefono = fields.String()
    biografia = fields.String()
    lineas_investigacion = fields.String()
    orcid = fields.String()
    creado_en = FechaHora()
    programa = fields.Function(lambda u: u.programa.nombre if u.programa else None)
    facultad = fields.Function(lambda u: u.programa.facultad.nombre if u.programa else None)


class LoginSchema(BaseSchema):
    correo = Texto(required=True)
    password = Clave(required=True)


class RegistroSchema(BaseSchema):
    nombre = Texto(required=True, validate=validate.Length(max=150, error="El nombre no puede superar 150 caracteres."))
    correo = Texto(required=True, validate=[validate.Email(error="Ingresa un correo válido."), validate.Length(max=190)])
    password = Clave(required=True, validate=validate.Length(min=8, error="La contraseña debe tener al menos 8 caracteres."))
    id_programa = Entero(required=True, validate=existe(Programa, "El programa seleccionado no existe."))
    justificacion = Texto(allow_none=True)


class PerfilSchema(BaseSchema):
    nombre = Texto(required=True, validate=validate.Length(max=150, error="El nombre no puede superar 150 caracteres."))
    telefono = Texto(allow_none=True, validate=validate.Length(max=30, error="El teléfono no puede superar 30 caracteres."))
    biografia = Texto(allow_none=True)
    lineas_investigacion = Texto(
        allow_none=True, validate=validate.Length(max=255, error="Las líneas de investigación no pueden superar 255 caracteres.")
    )
    orcid = Texto(allow_none=True, validate=validate.Length(max=25, error="El ORCID no puede superar 25 caracteres."))


class EstadoUsuarioSchema(BaseSchema):
    estado = Texto(required=True, validate=opcion(("aprobado", "rechazado"), "Estado no válido."))


class RolUsuarioSchema(BaseSchema):
    rol = Texto(required=True, validate=opcion(ROLES, "Rol no válido."))
