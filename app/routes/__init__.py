"""Rutas.

Define las direcciones (URL) y a que controlador llama cada una, junto con quien puede usarla.
- `web_routes.py`: las paginas HTML.
- `*_routes.py`: la API JSON bajo `/api`, un blueprint por modulo (`API_BLUEPRINTS`).
"""
from app.routes.analitica_routes import analitica_bp
from app.routes.auth_routes import auth_bp
from app.routes.catalogo_routes import catalogo_bp
from app.routes.evento_routes import evento_bp
from app.routes.logro_routes import logro_bp
from app.routes.notificacion_routes import notificacion_bp
from app.routes.proyecto_routes import proyecto_bp
from app.routes.publicacion_routes import publicacion_bp
from app.routes.semillero_routes import semillero_bp
from app.routes.usuario_routes import usuario_bp

API_BLUEPRINTS = (
    auth_bp,
    usuario_bp,
    catalogo_bp,
    semillero_bp,
    proyecto_bp,
    logro_bp,
    publicacion_bp,
    notificacion_bp,
    evento_bp,
    analitica_bp,
)
