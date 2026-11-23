"""Rutas de usuarios: /api/usuarios."""
from flask import Blueprint

from app.controllers import usuario_controller as c
from app.utils.auth import acceso
from app.utils.constantes import ADMINISTRADOR, DOCENTE_LIDER

usuario_bp = Blueprint("usuarios", __name__, url_prefix="/api/usuarios")

usuario_bp.get("")(acceso(ADMINISTRADOR)(c.listar))
usuario_bp.get("/estudiantes")(acceso(ADMINISTRADOR, DOCENTE_LIDER)(c.estudiantes))
usuario_bp.put("/me")(acceso()(c.actualizar_perfil))
usuario_bp.patch("/<int:id_>/estado")(acceso(ADMINISTRADOR)(c.cambiar_estado))
usuario_bp.patch("/<int:id_>/rol")(acceso(ADMINISTRADOR)(c.cambiar_rol))
usuario_bp.get("/<int:id_>/hoja-vida")(acceso()(c.hoja_de_vida))
