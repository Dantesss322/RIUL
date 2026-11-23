"""Piezas comunes de los schemas: nombres en camelCase, campos tolerantes a formularios y validadores.

La API habla JSON en `camelCase` (como el frontend) y el codigo Python en `snake_case`:
`BaseSchema` traduce en ambos sentidos, de modo que cada schema se escribe solo una vez.
"""
import re
from datetime import datetime, timezone

from marshmallow import EXCLUDE, Schema, ValidationError, fields, validate

from app.extensions import db
from app.utils.archivos import nombre_original
from app.utils.fechas import a_iso

_CAMEL = re.compile(r"_([a-z])")


def camelizar(nombre):
    """'id_docente_lider' -> 'idDocenteLider'."""
    return _CAMEL.sub(lambda m: m.group(1).upper(), nombre)


class BaseSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # llaves desconocidas se ignoran (p. ej. el campo `evidencia` de un multipart)

    def on_bind_field(self, field_name, field_obj):
        field_obj.data_key = camelizar(field_obj.data_key or field_name)


class VaciosComoNulos:
    """Los formularios envian "" por los campos que se dejan vacios: se tratan como nulos.

    Un campo obligatorio vacio responde "Falta: campo"; uno opcional queda en None.
    """

    default_error_messages = {"required": "Falta este campo.", "null": "Falta este campo.", "invalid": "Valor no válido."}

    def deserialize(self, value, attr=None, data=None, **kwargs):
        if isinstance(value, str) and not value.strip():
            value = None
        return super().deserialize(value, attr, data, **kwargs)


class Texto(VaciosComoNulos, fields.String):
    """Cadena sin espacios sobrantes."""

    def _deserialize(self, value, attr, data, **kwargs):
        return super()._deserialize(value, attr, data, **kwargs).strip()


class Entero(VaciosComoNulos, fields.Integer):
    pass


class Booleano(VaciosComoNulos, fields.Boolean):
    """Acepta true/false (JSON) y "true"/"on" (formularios)."""

    truthy = fields.Boolean.truthy | {"on"}


class FechaHora(VaciosComoNulos, fields.Field):
    """Fecha ISO 8601 (con o sin hora, con o sin `Z`) <-> datetime UTC.

    Un `<input type="date">` envia solo "AAAA-MM-DD": se interpreta como el final de ese dia,
    para que un evento o una convocatoria "del 30" siga vigente durante todo el 30.
    """

    def _serialize(self, value, attr, obj, **kwargs):
        return a_iso(value) if value else None

    def _deserialize(self, value, attr, data, **kwargs):
        try:
            fecha = datetime.fromisoformat(str(value).strip().replace("Z", "+00:00"))
        except ValueError as error:
            raise self.make_error("invalid") from error
        if len(str(value).strip()) == 10:
            fecha = fecha.replace(hour=23, minute=59, second=59)
        if fecha.tzinfo:
            fecha = fecha.astimezone(timezone.utc).replace(tzinfo=None)
        return fecha


class Evidencia(fields.Field):
    """Archivo adjunto de salida: { nombre, url } o None."""

    def _serialize(self, value, attr, obj, **kwargs):
        return {"nombre": nombre_original(value), "url": value} if value else None


def opcion(valores, mensaje):
    """Validador de lista cerrada con el mensaje exacto que ve el usuario."""
    return validate.OneOf(valores, error=mensaje)


def existe(modelo, mensaje):
    """Validador de llave foranea: el registro referenciado debe existir."""

    def validador(valor):
        if db.session.get(modelo, valor) is None:
            raise ValidationError(mensaje)

    return validador


def vista(schema, objeto, **extras):
    """Serializa un modelo con su schema y agrega datos calculados fuera del modelo (p. ej. XP o nivel)."""
    return {**schema.dump(objeto), **extras}
