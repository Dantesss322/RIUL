"""Controlador de eventos, convocatorias y postulaciones."""
from flask import request

from app.controllers.crud_controller import ControladorCrud
from app.schemas.evento import ConvocatoriaSchema, EventoSchema, ResolverPostulacionSchema
from app.services import catalogo_service, evento_service
from app.utils.auth import usuario_actual
from app.utils.request import validar
from app.utils.response import ok

# Editar y eliminar son el CRUD estandar; listar y crear tienen reglas propias.
eventos = ControladorCrud(catalogo_service.eventos, EventoSchema, registra_creador=True)
convocatorias = ControladorCrud(catalogo_service.convocatorias, ConvocatoriaSchema)


def listar_eventos():
    return ok(evento_service.listar_eventos(usuario_actual()))


def participar(id_):
    nombre = evento_service.participar(usuario_actual(), id_)
    return ok(None, f'Participación registrada en "{nombre}".', 201)


def listar_convocatorias():
    return ok(evento_service.listar_convocatorias(usuario_actual()))


def crear_convocatoria():
    convocatoria = evento_service.crear_convocatoria(usuario_actual(), validar(ConvocatoriaSchema()))
    return ok(convocatoria, "Convocatoria publicada y notificada a la comunidad.", 201)


def postular(id_):
    evento_service.postular(usuario_actual(), id_)
    return ok(None, "Postulación enviada correctamente.", 201)


def listar_postulaciones():
    return ok(evento_service.listar_postulaciones(request.args.get("estado")))


def resolver_postulacion(id_):
    estado = validar(ResolverPostulacionSchema())["estado"]
    evento_service.resolver_postulacion(id_, estado)
    return ok(None, "Postulación aprobada." if estado == "aprobada" else "Postulación rechazada.")
