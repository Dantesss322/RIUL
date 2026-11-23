"""Sobre de respuesta de la API: { success, message, data } o { success, message, details }."""
from flask import jsonify


def ok(data=None, message="OK", status=200):
    """Respuesta exitosa. El frontend muestra `message` en las operaciones que modifican datos."""
    return jsonify(success=True, message=message, data=data), status


def fail(message, status=400, details=None):
    """Respuesta de error con texto listo para el usuario final (en espanol)."""
    cuerpo = {"success": False, "message": message}
    if details:
        cuerpo["details"] = details
    return jsonify(cuerpo), status
