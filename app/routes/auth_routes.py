"""Rutas de autenticacion: /api/auth."""
from flask import Blueprint

from app.controllers import auth_controller as c
from app.utils.auth import acceso

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

auth_bp.post("/login")(c.login)
auth_bp.post("/register")(c.registrar)
auth_bp.get("/me")(acceso()(c.perfil))
