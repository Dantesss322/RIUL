"""Schemas de la comunidad: publicaciones, comentarios y notificaciones."""
from marshmallow import fields

from app.models import Semillero
from app.schemas.base_schema import BaseSchema, Booleano, Entero, Evidencia, FechaHora, Texto, existe, opcion
from app.utils.constantes import CATEGORIAS_PUBLICACION

SIN_COMENTARIO = "Escribe un comentario antes de enviarlo."


class PublicacionSchema(BaseSchema):
    id = fields.Integer()
    id_usuario = fields.Integer()
    id_semillero = fields.Integer()
    categoria = fields.String()
    contenido = fields.String()
    evidencia = Evidencia(attribute="evidencia_url")
    estado = fields.String()
    es_publico = fields.Boolean()
    fecha = FechaHora()
    autor = fields.Function(lambda p: p.autor.nombre)
    semillero = fields.Function(lambda p: p.semillero.nombre)


class CrearPublicacionSchema(BaseSchema):
    contenido = Texto(required=True)
    categoria = Texto(required=True, validate=opcion(CATEGORIAS_PUBLICACION, "Selecciona una categoría válida."))
    id_semillero = Entero(required=True, validate=existe(Semillero, "El semillero indicado no existe."))
    es_publico = Booleano(load_default=False)


class EstadoPublicacionSchema(BaseSchema):
    estado = Texto(required=True, validate=opcion(("publicada", "rechazada"), "Estado no válido."))


class ComentarioSchema(BaseSchema):
    id = fields.Integer(dump_only=True)
    id_publicacion = fields.Integer(dump_only=True)
    id_usuario = fields.Integer(dump_only=True)
    tipo = fields.String(dump_only=True)
    contenido = Texto(required=True, error_messages={"required": SIN_COMENTARIO, "null": SIN_COMENTARIO})
    fecha = FechaHora(dump_only=True)
    autor = fields.Function(lambda i: i.autor.nombre)


class NotificacionSchema(BaseSchema):
    id = fields.Integer()
    id_usuario = fields.Integer()
    tipo = fields.String()
    mensaje = fields.String()
    ruta = fields.String()
    leida = fields.Boolean()
    fecha = FechaHora()
