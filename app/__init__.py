"""Fabrica de la aplicacion RIUL."""
from flask import Flask
from flask_jwt_extended import JWTManager

# Importamos las configuraciones
from app.config import Config
from app.estensions import db

# Manejo de las rutas con blueprints
from app.routes.web_routes import web_bp


def create_app():
    app = Flask(
        __name__,
        static_folder="static",
        template_folder="templates",
    )

    # Cargamos las configuraciones
    app.config.from_object(Config)

    # Inicializamos la base de datos con la aplicacion
    db.init_app(app)

    # Inicializamos JWT
    JWTManager(app)

    # Registramos las rutas
    # Paginas (HTML)
    app.register_blueprint(web_bp)

    # API: los blueprints de la API (auth, semilleros, logros...) se registran
    # aqui con url_prefix="/api/..." cuando se construya el backend.

    # Variables disponibles en todas las plantillas
    @app.context_processor
    def variables_de_plantilla():
        return {"use_mocks": app.config["USE_MOCKS"]}

    # Cuando existan modelos: importarlos aqui y ejecutar db.create_all()
    # dentro de `with app.app_context():` para crear las tablas.

    return app
