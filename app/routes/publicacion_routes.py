"""Rutas de publicaciones: /api/publicaciones."""
from flask import Blueprint

from app.controllers import publicacion_controller as c
from app.utils.auth import acceso
from app.utils.constantes import DOCENTE_LIDER, ESTUDIANTE

publicacion_bp = Blueprint("publicaciones", __name__, url_prefix="/api")

publicacion_bp.get("/publicaciones")(acceso()(c.listar))
publicacion_bp.post("/publicaciones")(acceso(DOCENTE_LIDER, ESTUDIANTE)(c.crear))
publicacion_bp.patch("/publicaciones/<int:id_>/estado")(acceso(DOCENTE_LIDER)(c.moderar))
publicacion_bp.post("/publicaciones/<int:id_>/reaccion")(acceso()(c.reaccionar))
publicacion_bp.get("/publicaciones/<int:id_>/comentarios")(acceso()(c.comentarios))
publicacion_bp.post("/publicaciones/<int:id_>/comentarios")(acceso()(c.comentar))
publicacion_bp.post("/publicaciones/<int:id_>/compartir")(acceso()(c.compartir))
