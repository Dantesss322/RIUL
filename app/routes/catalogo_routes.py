"""Rutas de los catalogos administrables: facultades, programas, tipos de logro, niveles e insignias.

Todos exponen el CRUD estandar: la lectura es abierta (facultades y programas, que el registro necesita)
o para cualquier sesion; escribir es solo del administrador.
"""
from flask import Blueprint

from app.controllers import catalogo_controller as c
from app.utils.auth import acceso
from app.utils.constantes import ADMINISTRADOR

catalogo_bp = Blueprint("catalogos", __name__, url_prefix="/api")


def registrar_crud(blueprint, ruta, controlador, lectura_publica=False):
    """Registra GET (lista y detalle), POST, PUT y DELETE de un recurso.

    La lectura es publica o de cualquier sesion; escribir (POST, PUT, DELETE) exige ser administrador.
    """
    lectura = (lambda vista: vista) if lectura_publica else acceso()
    escritura = acceso(ADMINISTRADOR)
    reglas = (
        ("listar", "GET", "", lectura),
        ("obtener", "GET", "/<int:id_>", lectura),
        ("crear", "POST", "", escritura),
        ("actualizar", "PUT", "/<int:id_>", escritura),
        ("eliminar", "DELETE", "/<int:id_>", escritura),
    )
    for accion, metodo, sufijo, proteccion in reglas:
        blueprint.add_url_rule(
            f"/{ruta}{sufijo}",
            endpoint=f"{ruta}_{accion}",
            view_func=proteccion(getattr(controlador, accion)),
            methods=[metodo],
        )


registrar_crud(catalogo_bp, "facultades", c.facultades, lectura_publica=True)
registrar_crud(catalogo_bp, "programas", c.programas, lectura_publica=True)
registrar_crud(catalogo_bp, "tipos-logro", c.tipos_logro)
registrar_crud(catalogo_bp, "niveles", c.niveles)
registrar_crud(catalogo_bp, "insignias", c.insignias)
