"""Modelos.

Tablas de la base de datos como clases de SQLAlchemy (diseno en el MER, RIUL-DOCS/MER.md).
Importar este paquete registra todas las tablas en `db.metadata`, que es lo que necesita
`db.create_all()` al iniciar la aplicacion.
"""
from app.models.academico import Facultad, Programa
from app.models.comunidad import Interaccion, Notificacion, Publicacion
from app.models.evento import Convocatoria, Evento, EventoParticipante, Postulacion
from app.models.gamificacion import Insignia, Logro, Nivel, SemilleroInsignia, TipoLogro, UsuarioInsignia
from app.models.proyecto import AvanceProyecto, Proyecto
from app.models.semillero import SeguimientoSemillero, Semillero, SemilleroIntegrante
from app.models.usuario import Usuario

__all__ = [
    "AvanceProyecto", "Convocatoria", "Evento", "EventoParticipante", "Facultad", "Insignia",
    "Interaccion", "Logro", "Nivel", "Notificacion", "Postulacion", "Programa", "Proyecto",
    "Publicacion", "SeguimientoSemillero", "Semillero", "SemilleroInsignia", "SemilleroIntegrante",
    "TipoLogro", "Usuario", "UsuarioInsignia",
]
