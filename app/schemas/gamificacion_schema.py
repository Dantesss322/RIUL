"""Schemas de gamificacion: tipos de logro, niveles, insignias y logros."""
from marshmallow import fields, validate

from app.models import Proyecto, Semillero, TipoLogro
from app.schemas.base_schema import BaseSchema, Entero, Evidencia, FechaHora, Texto, existe, opcion
from app.utils.constantes import AMBITOS_INSIGNIA


class TipoLogroSchema(BaseSchema):
    id = fields.Integer(dump_only=True)
    nombre = Texto(required=True, validate=validate.Length(max=60, error="El nombre no puede superar 60 caracteres."))
    xp = Entero(required=True, validate=validate.Range(min=1, error="El XP debe ser mayor que cero."))


class NivelSchema(BaseSchema):
    id = fields.Integer(attribute="nivel", dump_only=True)
    nivel = Entero(required=True, validate=validate.Range(min=1, max=5, error="El nivel debe estar entre 1 y 5 estrellas."))
    xp_minimo = Entero(required=True, validate=validate.Range(min=0, error="El XP mínimo no puede ser negativo."))


class InsigniaSchema(BaseSchema):
    id = fields.Integer(dump_only=True)
    nombre = Texto(required=True, validate=validate.Length(max=80, error="El nombre no puede superar 80 caracteres."))
    descripcion = Texto(required=True, validate=validate.Length(max=255, error="La descripción no puede superar 255 caracteres."))
    ambito = Texto(required=True, validate=opcion(AMBITOS_INSIGNIA, "Selecciona a quién aplica la insignia."))
    id_tipo_logro = Entero(allow_none=True, validate=existe(TipoLogro, "El tipo de logro indicado no existe."))
    cantidad = Entero(
        attribute="cantidad_requerida", required=True, validate=validate.Range(min=1, error="La cantidad debe ser mayor que cero.")
    )
    icono = Texto(required=True, validate=validate.Length(max=30, error="El icono no puede superar 30 caracteres."))


class LogroSchema(BaseSchema):
    """Salida de un logro con los nombres que muestra la interfaz."""

    id = fields.Integer()
    id_usuario = fields.Integer()
    id_semillero = fields.Integer()
    id_tipo_logro = fields.Integer()
    id_proyecto = fields.Integer()
    titulo = fields.String()
    descripcion = fields.String()
    evidencia = Evidencia(attribute="evidencia_url")
    estado = fields.String()
    xp_asignado = fields.Integer()
    id_validador = fields.Integer()
    motivo_rechazo = fields.String()
    fecha_registro = FechaHora()
    fecha_validacion = FechaHora()
    tipo = fields.Function(lambda l: l.tipo_logro.nombre)
    xp_potencial = fields.Function(lambda l: l.tipo_logro.xp)
    usuario = fields.Function(lambda l: l.usuario.nombre)
    semillero = fields.Function(lambda l: l.semillero.nombre)
    proyecto = fields.Function(lambda l: l.proyecto.nombre if l.proyecto else None)


class RegistrarLogroSchema(BaseSchema):
    id_tipo_logro = Entero(required=True, validate=existe(TipoLogro, "El tipo de logro indicado no existe."))
    id_semillero = Entero(required=True, validate=existe(Semillero, "El semillero indicado no existe."))
    id_proyecto = Entero(allow_none=True, validate=existe(Proyecto, "El proyecto indicado no existe."))
    titulo = Texto(required=True, validate=validate.Length(max=190, error="El título no puede superar 190 caracteres."))
    descripcion = Texto(allow_none=True)


class RechazarLogroSchema(BaseSchema):
    motivo = Texto(
        required=True,
        error_messages={"required": "Indica el motivo del rechazo.", "null": "Indica el motivo del rechazo."},
    )
