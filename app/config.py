"""Configuracion de la aplicacion. Todo valor sensible llega por variables de entorno (.env)."""
import os


class Config:

    # URL de conexion de SQLAlchemy con MySQL
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://riul_user:riul_password@db:3306/riul_db",
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Clave con la que se firman los JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "clave-de-desarrollo")

    # 3600 segundos = 1 hora
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", "3600"))

    # true: la interfaz usa datos simulados; false: usa la API real
    USE_MOCKS = os.getenv("USE_MOCKS", "true").lower() == "true"
