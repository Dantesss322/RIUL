"""Configuracion de la aplicacion. Todo valor sensible llega por variables de entorno (.env)."""
import os

# Raiz del proyecto (la carpeta que contiene `app/`)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Config:

    # URL de conexion de SQLAlchemy con MySQL
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://riul_user:riul_password@db:3306/riul_db",
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Descarta conexiones caidas (MySQL cierra las inactivas) antes de usarlas
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    # Clave con la que se firman los JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "clave-de-desarrollo-solo-para-entornos-locales")

    # 3600 segundos = 1 hora
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", "3600"))

    # Evidencias (logros, avances, publicaciones): carpeta de destino y tamano maximo (10 MB)
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", os.path.join(RAIZ, "uploads"))
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024

    # Cuenta del administrador inicial: se crea al arrancar si aun no existe
    ADMIN_NOMBRE = os.getenv("ADMIN_NOMBRE", "Administrador RIUL")
    ADMIN_CORREO = os.getenv("ADMIN_CORREO", "admin@unilibre.edu.co").lower()
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Riul2026*")
