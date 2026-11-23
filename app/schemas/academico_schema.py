"""Schemas de la estructura academica."""
from marshmallow import fields, validate

from app.models import Facultad
from app.schemas.base_schema import BaseSchema, Entero, Texto, existe


class FacultadSchema(BaseSchema):
    id = fields.Integer(dump_only=True)
    nombre = Texto(required=True, validate=validate.Length(max=150, error="El nombre no puede superar 150 caracteres."))


class ProgramaSchema(BaseSchema):
    id = fields.Integer(dump_only=True)
    nombre = Texto(required=True, validate=validate.Length(max=150, error="El nombre no puede superar 150 caracteres."))
    id_facultad = Entero(required=True, validate=existe(Facultad, "La facultad indicada no existe."))
    facultad = fields.Function(lambda programa: programa.facultad.nombre)
