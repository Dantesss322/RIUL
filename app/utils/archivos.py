"""Evidencias: documentos e imagenes que respaldan logros, avances y publicaciones."""
import os
from uuid import uuid4

from flask import current_app
from werkzeug.utils import secure_filename

from app.utils.errors import DatosInvalidos

EXTENSIONES = {"pdf", "png", "jpg", "jpeg", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "zip"}
RUTA_PUBLICA = "/api/archivos/"


def guardar_evidencia(archivo):
    """Guarda el archivo subido con un prefijo unico y devuelve la ruta con la que se consulta."""
    nombre = secure_filename(archivo.filename) or "evidencia"
    if nombre.rsplit(".", 1)[-1].lower() not in EXTENSIONES:
        raise DatosInvalidos(
            "El formato del archivo no está permitido.",
            {"evidencia": [f"Formatos permitidos: {', '.join(sorted(EXTENSIONES))}."]},
        )

    carpeta = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(carpeta, exist_ok=True)
    guardado = f"{uuid4().hex}_{nombre}"
    archivo.save(os.path.join(carpeta, guardado))
    return RUTA_PUBLICA + guardado


def nombre_original(ruta):
    """'/api/archivos/<uuid>_informe.pdf' -> 'informe.pdf'."""
    return ruta.rsplit("/", 1)[-1].split("_", 1)[-1]
