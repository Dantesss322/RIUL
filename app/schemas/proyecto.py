"""Schemas de proyectos y avances."""
from marshmallow import fields, validate

from app.models import Semillero
from app.schemas.base import BaseSchema, Booleano, Entero, Evidencia, FechaHora, Texto, existe, opcion
from app.utils.constantes import ESTADOS_PROYECTO


class ProyectoSchema(BaseSchema):
    id = fields.Integer(dump_only=True)
    id_semillero = Entero(required=True, validate=existe(Semillero, "El semillero indicado no existe."))
    nombre = Texto(required=True, validate=validate.Length(max=190, error="El nombre no puede superar 190 caracteres."))
    descripcion = Texto(required=True)
    estado = Texto(validate=opcion(ESTADOS_PROYECTO, "Estado no válido."))
    es_publico = Booleano(load_default=False)
    fecha_inicio = FechaHora(dump_only=True)
    semillero = fields.Function(lambda p: p.semillero.nombre)
    total_avances = fields.Integer(dump_only=True)


class AvanceSchema(BaseSchema):
    id = fields.Integer(dump_only=True)
    id_proyecto = fields.Integer(dump_only=True)
    id_autor = fields.Integer(dump_only=True)
    descripcion = Texto(required=True)
    evidencia = Evidencia(attribute="evidencia_url", dump_only=True)
    fecha = FechaHora(dump_only=True)
    autor = fields.Function(lambda a: a.autor.nombre)
