"""Schemas de eventos, convocatorias y postulaciones."""
from marshmallow import fields, validate

from app.schemas.base import BaseSchema, Entero, FechaHora, Texto, opcion
from app.utils.constantes import MODALIDADES
from app.utils.fechas import ahora, dias_desde


class EventoSchema(BaseSchema):
    id = fields.Integer(dump_only=True)
    nombre = Texto(required=True, validate=validate.Length(max=190, error="El nombre no puede superar 190 caracteres."))
    descripcion = Texto(required=True)
    fecha = FechaHora(required=True)
    lugar = Texto(required=True, validate=validate.Length(max=190, error="El lugar no puede superar 190 caracteres."))
    modalidad = Texto(required=True, validate=opcion(MODALIDADES, "Selecciona una modalidad válida."))
    cupos = Entero(required=True, validate=validate.Range(min=1, error="Los cupos deben ser mayores que cero."))
    id_creador = fields.Integer(dump_only=True)
    inscritos = fields.Integer(dump_only=True)
    cupos_disponibles = fields.Function(lambda e: max(e.cupos - e.inscritos, 0))
    pasado = fields.Function(lambda e: e.fecha <= ahora())


class ConvocatoriaSchema(BaseSchema):
    id = fields.Integer(dump_only=True)
    titulo = Texto(required=True, validate=validate.Length(max=190, error="El título no puede superar 190 caracteres."))
    descripcion = Texto(required=True)
    fecha_limite = FechaHora(required=True)
    id_creador = fields.Integer(dump_only=True)
    abierta = fields.Function(lambda c: c.fecha_limite > ahora())
    dias_restantes = fields.Function(lambda c: max(-dias_desde(c.fecha_limite), 0))


class PostulacionSchema(BaseSchema):
    id = fields.Integer()
    id_convocatoria = fields.Integer()
    id_usuario = fields.Integer()
    estado = fields.String()
    fecha = FechaHora()
    convocatoria = fields.Function(lambda p: p.convocatoria.titulo)
    usuario = fields.Function(lambda p: p.usuario.nombre)


class ResolverPostulacionSchema(BaseSchema):
    estado = Texto(required=True, validate=opcion(("aprobada", "rechazada"), "Estado no válido."))
