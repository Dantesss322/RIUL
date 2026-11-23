"""Fabrica de la aplicacion RIUL."""
from flask import Flask

# Importamos las configuraciones
from app import models  # noqa: F401  (registra las tablas en db.metadata para db.create_all)
from app.config import Config
from app.estensions import db, jwt

# Manejo de las rutas con blueprints
from app.routes import API_BLUEPRINTS
from app.routes.web_routes import web_bp
from app.utils.errors import registrar_manejadores
from app.utils.seed import sembrar_datos_base


def create_app():
    app = Flask(
        __name__,
        static_folder="static",
        template_folder="templates",
    )

    # Cargamos las configuraciones
    app.config.from_object(Config)

    # Inicializamos la base de datos y JWT con la aplicacion
    db.init_app(app)
    jwt.init_app(app)

    # Errores de la API (validacion, permisos, sesion) con el sobre { success, message }
    registrar_manejadores(app)

    # Registramos las rutas
    # Paginas (HTML)
    app.register_blueprint(web_bp)

    # API (JSON) bajo /api
    for blueprint in API_BLUEPRINTS:
        app.register_blueprint(blueprint)

    # Crea las tablas que falten y los datos base (reglas de gamificacion, estructura academica, administrador)
    with app.app_context():
        db.create_all()
        sembrar_datos_base(app.config)
        # Con `gunicorn --preload` esta funcion corre antes de crear los workers: se cierran las
        # conexiones abiertas para que cada worker abra las suyas y no compartan el mismo socket.
        db.engine.dispose()

    return app
