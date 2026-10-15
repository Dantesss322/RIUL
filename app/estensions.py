"""Extensiones de Flask compartidas por toda la aplicacion.

Se crean aqui, sin aplicacion, para evitar importaciones circulares;
`create_app` (app/__init__.py) las inicializa con `init_app`.
"""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
