"""Rutas de logros: /api/logros."""
from flask import Blueprint

from app.controllers import logro_controller as c
from app.utils.auth import acceso
from app.utils.constantes import ADMINISTRADOR, DOCENTE_LIDER, ESTUDIANTE

logro_bp = Blueprint("logros", __name__, url_prefix="/api/logros")

logro_bp.get("")(acceso()(c.listar))
logro_bp.post("")(acceso(DOCENTE_LIDER, ESTUDIANTE)(c.registrar))
logro_bp.patch("/<int:id_>/enviar")(acceso(DOCENTE_LIDER)(c.enviar))
logro_bp.patch("/<int:id_>/aprobar")(acceso(ADMINISTRADOR)(c.aprobar))
logro_bp.patch("/<int:id_>/rechazar")(acceso(ADMINISTRADOR, DOCENTE_LIDER)(c.rechazar))
