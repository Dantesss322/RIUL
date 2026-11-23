"""Rutas de proyectos: /api/proyectos."""
from flask import Blueprint

from app.controllers import proyecto_controller as c
from app.utils.auth import acceso
from app.utils.constantes import DOCENTE_LIDER

proyecto_bp = Blueprint("proyectos", __name__, url_prefix="/api/proyectos")

proyecto_bp.get("")(acceso()(c.listar))
proyecto_bp.get("/<int:id_>")(acceso()(c.detalle))
proyecto_bp.post("")(acceso(DOCENTE_LIDER)(c.crear))
proyecto_bp.put("/<int:id_>")(acceso(DOCENTE_LIDER)(c.actualizar))
proyecto_bp.post("/<int:id_>/avances")(acceso(DOCENTE_LIDER)(c.publicar_avance))
