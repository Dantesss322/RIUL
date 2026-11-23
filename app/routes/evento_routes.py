"""Rutas de eventos y convocatorias institucionales: /api/eventos, /api/convocatorias, /api/postulaciones."""
from flask import Blueprint

from app.controllers import evento_controller as c
from app.utils.auth import acceso
from app.utils.constantes import ADMINISTRADOR, DOCENTE_LIDER, ESTUDIANTE

evento_bp = Blueprint("eventos", __name__, url_prefix="/api")

# Eventos: los publica solo el administrador; docentes y estudiantes registran su participacion.
evento_bp.get("/eventos")(acceso()(c.listar_eventos))
evento_bp.add_url_rule("/eventos", "crear_evento", acceso(ADMINISTRADOR)(c.eventos.crear), methods=["POST"])
evento_bp.add_url_rule("/eventos/<int:id_>", "actualizar_evento", acceso(ADMINISTRADOR)(c.eventos.actualizar), methods=["PUT"])
evento_bp.add_url_rule("/eventos/<int:id_>", "eliminar_evento", acceso(ADMINISTRADOR)(c.eventos.eliminar), methods=["DELETE"])
evento_bp.post("/eventos/<int:id_>/participaciones")(acceso(DOCENTE_LIDER, ESTUDIANTE)(c.participar))

# Convocatorias: las publica el administrador; los estudiantes se postulan.
evento_bp.get("/convocatorias")(acceso()(c.listar_convocatorias))
evento_bp.post("/convocatorias")(acceso(ADMINISTRADOR)(c.crear_convocatoria))
evento_bp.add_url_rule(
    "/convocatorias/<int:id_>", "actualizar_convocatoria", acceso(ADMINISTRADOR)(c.convocatorias.actualizar), methods=["PUT"]
)
evento_bp.add_url_rule(
    "/convocatorias/<int:id_>", "eliminar_convocatoria", acceso(ADMINISTRADOR)(c.convocatorias.eliminar), methods=["DELETE"]
)
evento_bp.post("/convocatorias/<int:id_>/postulaciones")(acceso(ESTUDIANTE)(c.postular))

# Postulaciones: bandeja del administrador.
evento_bp.get("/postulaciones")(acceso(ADMINISTRADOR)(c.listar_postulaciones))
evento_bp.patch("/postulaciones/<int:id_>")(acceso(ADMINISTRADOR)(c.resolver_postulacion))
