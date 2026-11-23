"""Schemas de semilleros, integrantes y vinculaciones."""
from marshmallow import fields, validate

from app.models import Facultad, Usuario
from app.schemas.base_schema import BaseSchema, Entero, FechaHora, Texto, existe, opcion
from app.utils.constantes import ROLES_INTEGRANTE


class SemilleroSchema(BaseSchema):
    id = fields.Integer(dump_only=True)
    nombre = Texto(required=True, validate=validate.Length(max=190, error="El nombre no puede superar 190 caracteres."))
    descripcion = Texto(required=True)
    id_facultad = Entero(required=True, validate=existe(Facultad, "La facultad indicada no existe."))
    id_docente_lider = Entero(required=True, validate=existe(Usuario, "El docente líder indicado no existe."))
    creado_en = FechaHora(dump_only=True)
    facultad = fields.Function(lambda se: se.facultad.nombre)
    docente_lider = fields.Function(lambda se: se.docente_lider.nombre)
    total_integrantes = fields.Integer(dump_only=True)


class IntegranteSchema(BaseSchema):
    """Integrante o solicitud de vinculacion, con los nombres que muestra la interfaz."""

    id = fields.Integer()
    id_semillero = fields.Integer()
    id_usuario = fields.Integer()
    rol = fields.String()
    estado = fields.String()
    fecha_ingreso = FechaHora()
    semillero = fields.Function(lambda i: i.semillero.nombre)
    usuario = fields.Function(lambda i: i.usuario.nombre)
    programa = fields.Function(lambda i: i.usuario.programa.nombre if i.usuario.programa else None)


class AgregarIntegranteSchema(BaseSchema):
    id_usuario = Entero(required=True, validate=existe(Usuario, "La persona indicada no existe."))
    rol = Texto(required=True, validate=opcion(ROLES_INTEGRANTE, "Selecciona un rol válido."))


class RolIntegranteSchema(BaseSchema):
    rol = Texto(required=True, validate=opcion(ROLES_INTEGRANTE, "Selecciona un rol válido."))


class SolicitudVinculacionSchema(BaseSchema):
    id_semillero = Entero(required=True)


class ResolverVinculacionSchema(BaseSchema):
    estado = Texto(required=True, validate=opcion(("activo", "rechazado"), "Estado no válido."))
