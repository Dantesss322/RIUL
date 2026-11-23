"""Transacciones de la base de datos."""
from functools import wraps

from app.estensions import db


def transaccional(funcion):
    """Ejecuta una operacion de servicio como una sola transaccion.

    Confirma al terminar bien; si algo falla (regla de negocio o error del sistema) deshace todo,
    de modo que una operacion de varios pasos (aprobar un logro, asignar XP, otorgar insignias,
    notificar) nunca queda a medias.
    """

    @wraps(funcion)
    def envoltura(*args, **kwargs):
        try:
            resultado = funcion(*args, **kwargs)
            db.session.commit()
            return resultado
        except Exception:
            db.session.rollback()
            raise

    return envoltura
