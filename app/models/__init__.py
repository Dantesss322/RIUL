"""Modelos.

Tablas de la base de datos como clases de SQLAlchemy, una por archivo (diseno en el MER, RIUL-DOCS/MER.md).
Importar este paquete registra todas las tablas en `db.metadata`, que es lo que necesita
`db.create_all()` al iniciar la aplicacion.
"""
from app.models.avance_proyecto import AvanceProyecto
from app.models.convocatoria import Convocatoria
from app.models.evento import Evento
from app.models.evento_participante import EventoParticipante
from app.models.facultad import Facultad
from app.models.insignia import Insignia
from app.models.interaccion import Interaccion
from app.models.logro import Logro
from app.models.nivel import Nivel
from app.models.notificacion import Notificacion
from app.models.postulacion import Postulacion
from app.models.programa import Programa
from app.models.proyecto import Proyecto
from app.models.publicacion import Publicacion
from app.models.seguimiento_semillero import SeguimientoSemillero
from app.models.semillero import Semillero
from app.models.semillero_insignia import SemilleroInsignia
from app.models.semillero_integrante import SemilleroIntegrante
from app.models.tipo_logro import TipoLogro
from app.models.usuario import Usuario
from app.models.usuario_insignia import UsuarioInsignia

__all__ = [
    "AvanceProyecto", "Convocatoria", "Evento", "EventoParticipante", "Facultad", "Insignia",
    "Interaccion", "Logro", "Nivel", "Notificacion", "Postulacion", "Programa", "Proyecto",
    "Publicacion", "SeguimientoSemillero", "Semillero", "SemilleroInsignia", "SemilleroIntegrante",
    "TipoLogro", "Usuario", "UsuarioInsignia",
]
