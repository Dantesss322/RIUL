"""Controlador de archivos: entrega las evidencias guardadas en disco."""
from flask import current_app, send_from_directory


def evidencia(nombre):
    """`send_from_directory` rechaza rutas que intenten salir de la carpeta de evidencias."""
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], nombre)
