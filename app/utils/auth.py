"""Control de acceso: sesion JWT y roles (RBAC)."""
from functools import wraps

from flask import g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.extensions import db
from app.models import Usuario
from app.utils.errors import NoAutenticado, Prohibido


def acceso(*roles):
    """Protege una vista: exige sesion valida de una cuenta aprobada y, si se indican, uno de los roles.

    Sin sesion responde 401; con un rol insuficiente, 403. El usuario queda en `usuario_actual()`.
    """

    def decorador(vista):
        @wraps(vista)
        def envoltura(*args, **kwargs):
            verify_jwt_in_request()
            usuario = db.session.get(Usuario, int(get_jwt_identity()))
            if usuario is None or usuario.estado != "aprobado":
                raise NoAutenticado()
            if roles and usuario.rol not in roles:
                raise Prohibido()
            g.usuario = usuario
            return vista(*args, **kwargs)

        return envoltura

    return decorador


def usuario_actual():
    """Usuario autenticado de la peticion en curso (solo dentro de una vista protegida con `acceso`)."""
    return g.usuario
