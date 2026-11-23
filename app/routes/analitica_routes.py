"""Rutas de analitica, consulta publica y archivos: /api/dashboard, /api/ranking, /api/public, /api/archivos."""
from flask import Blueprint

from app.controllers import analitica_controller as c
from app.controllers import archivo_controller as a
from app.utils.auth import acceso
from app.utils.constantes import ADMINISTRADOR

analitica_bp = Blueprint("analitica", __name__, url_prefix="/api")

analitica_bp.get("/dashboard")(acceso()(c.dashboard))
analitica_bp.get("/ranking")(acceso()(c.ranking))
analitica_bp.get("/insignias/mias")(acceso()(c.insignias))
analitica_bp.get("/indicadores")(acceso(ADMINISTRADOR)(c.indicadores))

# Consulta publica (RF-8): sin sesion y sin datos personales.
analitica_bp.get("/public/home")(c.inicio_publico)
analitica_bp.get("/public/<tipo>")(c.listado_publico)

# Evidencias adjuntas: solo con sesion iniciada.
analitica_bp.get("/archivos/<path:nombre>")(acceso()(a.evidencia))
