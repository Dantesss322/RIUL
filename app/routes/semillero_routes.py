"""Rutas de investigacion: semilleros, integrantes y vinculaciones."""
from flask import Blueprint

from app.controllers import semillero_controller as c
from app.utils.auth import acceso
from app.utils.constantes import ADMINISTRADOR, DOCENTE_LIDER, ESTUDIANTE

semillero_bp = Blueprint("semilleros", __name__, url_prefix="/api")

# Semilleros: cualquier sesion consulta; solo el administrador los crea, edita y elimina.
semillero_bp.get("/semilleros")(acceso()(c.listar))
semillero_bp.get("/semilleros/<int:id_>")(acceso()(c.detalle))
semillero_bp.post("/semilleros")(acceso(ADMINISTRADOR)(c.crear))
semillero_bp.put("/semilleros/<int:id_>")(acceso(ADMINISTRADOR)(c.actualizar))
semillero_bp.delete("/semilleros/<int:id_>")(acceso(ADMINISTRADOR)(c.eliminar))

semillero_bp.post("/semilleros/<int:id_>/seguimiento")(acceso()(c.seguir))
semillero_bp.delete("/semilleros/<int:id_>/seguimiento")(acceso()(c.dejar_de_seguir))

# Integrantes: la regla de "lider dueno" la aplica el servicio.
semillero_bp.post("/semilleros/<int:id_>/integrantes")(acceso(ADMINISTRADOR, DOCENTE_LIDER)(c.agregar_integrante))
semillero_bp.patch("/integrantes/<int:id_>")(acceso(ADMINISTRADOR, DOCENTE_LIDER)(c.cambiar_rol_integrante))
semillero_bp.delete("/integrantes/<int:id_>")(acceso(ADMINISTRADOR, DOCENTE_LIDER)(c.retirar_integrante))

# Vinculaciones: el estudiante solicita; el lider del semillero resuelve.
semillero_bp.get("/vinculaciones")(acceso()(c.listar_vinculaciones))
semillero_bp.post("/vinculaciones")(acceso(ESTUDIANTE)(c.solicitar_vinculacion))
semillero_bp.patch("/vinculaciones/<int:id_>")(acceso(DOCENTE_LIDER)(c.resolver_vinculacion))
