"""Controladores de los catalogos administrables (estructura academica y reglas de gamificacion)."""
from app.controllers.crud_controller import ControladorCrud
from app.schemas.academico import FacultadSchema, ProgramaSchema
from app.schemas.gamificacion import InsigniaSchema, NivelSchema, TipoLogroSchema
from app.services import catalogo_service

facultades = ControladorCrud(catalogo_service.facultades, FacultadSchema)
programas = ControladorCrud(catalogo_service.programas, ProgramaSchema)
tipos_logro = ControladorCrud(catalogo_service.tipos_logro, TipoLogroSchema)
niveles = ControladorCrud(catalogo_service.niveles, NivelSchema)
insignias = ControladorCrud(catalogo_service.insignias, InsigniaSchema)
