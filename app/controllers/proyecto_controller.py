"""Controlador de proyectos y avances."""
from flask import request

from app.schemas.proyecto import AvanceSchema, ProyectoSchema
from app.services import proyecto_service
from app.utils.auth import usuario_actual
from app.utils.request import validar
from app.utils.response import ok


def listar():
    return ok(proyecto_service.listar(usuario_actual(), request.args.get("q", ""), request.args.get("estado")))


def detalle(id_):
    return ok(proyecto_service.detalle(usuario_actual(), id_))


def crear():
    datos = validar(ProyectoSchema(exclude=("estado",)))
    return ok(proyecto_service.crear(usuario_actual(), datos), "Proyecto registrado correctamente.", 201)


def actualizar(id_):
    datos = validar(ProyectoSchema(exclude=("id_semillero",)), parcial=True)
    return ok(proyecto_service.actualizar(usuario_actual(), id_, datos), "Proyecto actualizado correctamente.")


def publicar_avance(id_):
    proyecto_service.publicar_avance(usuario_actual(), id_, validar(AvanceSchema(), evidencia="opcional"))
    return ok(None, "Avance publicado correctamente.", 201)
