"""Extensiones de Flask compartidas por toda la aplicacion.

Se crean aqui, sin aplicacion, para evitar importaciones circulares;
`create_app` (app/__init__.py) las inicializa con `init_app`.
"""
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base declarativa de todos los modelos (estilo SQLAlchemy 2.0 con `Mapped`)."""


# expire_on_commit=False: tras confirmar una operacion el objeto conserva sus datos,
# y la respuesta se arma sin volver a consultar la base de datos.
db = SQLAlchemy(model_class=Base, session_options={"expire_on_commit": False})

jwt = JWTManager()
