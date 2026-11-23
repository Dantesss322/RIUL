"""Controlador de proyectos y avances."""
from flask import request

from app.schemas.proyecto_schema import AvanceSchema, ProyectoSchema
from app.services import proyecto_service
from app.utils.auth import usuario_actual
from app.utils.request import validar
from app.utils.response import success


def listar():
    return success(proyecto_service.listar(usuario_actual(), request.args.get("q", ""), request.args.get("estado")))


def detalle(id_):
    return success(proyecto_service.detalle(usuario_actual(), id_))


def crear():
    datos = validar(ProyectoSchema(exclude=("estado",)))
    return success(proyecto_service.crear(usuario_actual(), datos), "Proyecto registrado correctamente.", 201)


def actualizar(id_):
    datos = validar(ProyectoSchema(exclude=("id_semillero",)), parcial=True)
    return success(proyecto_service.actualizar(usuario_actual(), id_, datos), "Proyecto actualizado correctamente.")


def publicar_avance(id_):
    proyecto_service.publicar_avance(usuario_actual(), id_, validar(AvanceSchema(), evidencia="opcional"))
    return success(None, "Avance publicado correctamente.", 201)
