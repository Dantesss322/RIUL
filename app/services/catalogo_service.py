"""Catalogos administrables: estructura academica y reglas de gamificacion (RF-7.1)."""
from app.models import (
    EventoParticipante,
    Insignia,
    Logro,
    Postulacion,
    Programa,
    Semillero,
    SemilleroInsignia,
    UsuarioInsignia,
    Usuario,
)
from app.repositories.academico_repository import FacultadRepository, ProgramaRepository
from app.repositories.evento_repository import ConvocatoriaRepository, EventoRepository
from app.repositories.gamificacion_repository import InsigniaRepository, NivelRepository, TipoLogroRepository
from app.schemas.academico_schema import FacultadSchema, ProgramaSchema
from app.schemas.evento_schema import ConvocatoriaSchema, EventoSchema
from app.schemas.gamificacion_schema import InsigniaSchema, NivelSchema, TipoLogroSchema
from app.services.crud_service import ServicioCrud

facultades = ServicioCrud(
    FacultadRepository,
    FacultadSchema,
    dependientes=[(Programa, "id_facultad", "programas"), (Semillero, "id_facultad", "semilleros")],
)

programas = ServicioCrud(
    ProgramaRepository,
    ProgramaSchema,
    dependientes=[(Usuario, "id_programa", "usuarios")],
)

tipos_logro = ServicioCrud(
    TipoLogroRepository,
    TipoLogroSchema,
    dependientes=[(Logro, "id_tipo_logro", "logros"), (Insignia, "id_tipo_logro", "insignias")],
)

niveles = ServicioCrud(NivelRepository, NivelSchema)

insignias = ServicioCrud(
    InsigniaRepository,
    InsigniaSchema,
    dependientes=[(UsuarioInsignia, "id_insignia", "insignias otorgadas"), (SemilleroInsignia, "id_insignia", "insignias otorgadas")],
)

eventos = ServicioCrud(
    EventoRepository,
    EventoSchema,
    dependientes=[(EventoParticipante, "id_evento", "participaciones")],
)

convocatorias = ServicioCrud(
    ConvocatoriaRepository,
    ConvocatoriaSchema,
    dependientes=[(Postulacion, "id_convocatoria", "postulaciones")],
)
