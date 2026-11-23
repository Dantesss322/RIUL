"""Errores de la API y su tratamiento central.

Los servicios lanzan `ApiError` (o una subclase) y nunca arman respuestas HTTP: el manejador
registrado en `registrar_manejadores` las convierte en el sobre { success, message }.
Asi no hay bloques try/except repetidos en controladores ni rutas.
"""
from flask import request
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import HTTPException

from app.extensions import db, jwt
from app.utils.response import error

ERROR_SISTEMA = "Ocurrió un exc en el sistema. Intenta de nuevo en unos minutos."

# Mensajes genericos de los campos (schemas/base.py) que se completan con el nombre del campo.
GENERICOS = {
    "Falta este campo.": "Falta: {}.",
    "Valor no válido.": "Valor no válido en {}.",
}


class ApiError(Exception):
    status = 400
    mensaje = "No se pudo completar la solicitud."

    def __init__(self, mensaje=None, details=None):
        super().__init__(mensaje or self.mensaje)
        self.mensaje = mensaje or self.mensaje
        self.details = details


class DatosInvalidos(ApiError):
    status = 422
    mensaje = "Revisa los datos ingresados."


class NoAutenticado(ApiError):
    status = 401
    mensaje = "Debes iniciar sesión para continuar."


class Prohibido(ApiError):
    status = 403
    mensaje = "No tienes permisos para realizar esta acción."


class NoEncontrado(ApiError):
    status = 404

    def __init__(self, que="El recurso"):
        """`que` lleva su articulo ("El proyecto", "La publicación") para concordar el genero del mensaje."""
        super().__init__(f"{que} no fue {'encontrada' if que.startswith('La ') else 'encontrado'}.")


class Conflicto(ApiError):
    status = 409
    mensaje = "La operación entra en conflicto con los datos existentes."


def _detalles(errores):
    """{campo: [mensajes marshmallow]} -> {campo: [mensajes en espanol con el nombre del campo]}."""
    return {
        campo: [GENERICOS[m].format(campo) if m in GENERICOS else m for m in mensajes]
        for campo, mensajes in errores.items()
    }


def registrar_manejadores(app):
    """Conecta los errores de la aplicacion con el sobre de respuesta de la API."""

    @app.errorhandler(ApiError)
    def _api(exc):
        return error(exc.mensaje, exc.status, exc.details)

    @app.errorhandler(ValidationError)
    def _validacion(exc):
        detalles = _detalles(exc.normalized_messages())
        faltan = any(m.startswith("Falta:") for mensajes in detalles.values() for m in mensajes)
        mensaje = "Completa los campos obligatorios." if faltan else DatosInvalidos.mensaje
        return error(mensaje, 422, detalles)

    @app.errorhandler(IntegrityError)
    def _integridad(exc):
        db.session.rollback()
        app.logger.warning("Conflicto de integridad: %s", exc.orig)
        # Los borrados con dependientes se validan antes; lo que llega aqui es casi siempre un duplicado.
        return error("Ya existe un registro con esos datos.", 409)

    @app.errorhandler(HTTPException)
    def _http(exc):
        if not request.path.startswith("/api/"):
            return exc
        if exc.code == 413:
            return error("El archivo supera el tamaño permitido (10 MB).", 413)
        if exc.code == 405:
            return error("Método no permitido para esta ruta.", 405)
        return error(exc.description or ERROR_SISTEMA, exc.code or 500)

    @app.errorhandler(Exception)
    def _sistema(exc):
        db.session.rollback()
        app.logger.exception("Error no controlado")
        if request.path.startswith("/api/"):
            return error(ERROR_SISTEMA, 500)
        raise exc

    # Sesion JWT: toda falla de autenticacion es un 401 con texto para el usuario.
    @jwt.unauthorized_loader
    @jwt.invalid_token_loader
    def _sin_token(_motivo):
        return error(NoAutenticado.mensaje, 401)

    @jwt.expired_token_loader
    def _vencido(_cabecera, _datos):
        return error("Tu sesión expiró. Inicia sesión nuevamente.", 401)
