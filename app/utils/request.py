"""Lectura y validacion del cuerpo de la peticion (JSON o multipart con evidencia)."""
from flask import request
from marshmallow import ValidationError

from app.utils.archivos import guardar_evidencia


def cuerpo():
    """Datos enviados por el cliente: JSON o formulario multipart (los archivos se leen aparte)."""
    if request.is_json:
        datos = request.get_json(silent=True)
        return datos if isinstance(datos, dict) else {}
    return request.form.to_dict()


def validar(schema, parcial=False, evidencia=None):
    """Valida el cuerpo con un schema y devuelve los datos limpios (llaves en snake_case).

    `evidencia`: None (el endpoint no recibe archivo), "opcional" o "requerida". Si hay archivo valido,
    se guarda en disco y su ruta llega en `evidencia_url`. El archivo se guarda solo cuando
    todo lo demas ya es valido, para no dejar archivos huerfanos.
    """
    errores = {}
    try:
        datos = schema.load(cuerpo(), partial=parcial)
    except ValidationError as error:
        datos, errores = {}, error.normalized_messages()

    archivo = request.files.get("evidencia") if evidencia else None
    archivo = archivo if archivo and archivo.filename else None
    if evidencia == "requerida" and archivo is None:
        errores["evidencia"] = ["Falta este campo."]

    if errores:
        raise ValidationError(errores)
    if archivo:
        datos["evidencia_url"] = guardar_evidencia(archivo)
    return datos
