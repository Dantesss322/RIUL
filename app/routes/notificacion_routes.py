"""Rutas de notificaciones: /api/notificaciones (siempre las del usuario autenticado)."""
from flask import Blueprint

from app.controllers import notificacion_controller as c
from app.utils.auth import acceso

notificacion_bp = Blueprint("notificaciones", __name__, url_prefix="/api/notificaciones")

notificacion_bp.get("")(acceso()(c.listar))
notificacion_bp.get("/conteo")(acceso()(c.conteo))
notificacion_bp.patch("/leidas")(acceso()(c.marcar_todas_leidas))
notificacion_bp.patch("/<int:id_>/leida")(acceso()(c.marcar_leida))
