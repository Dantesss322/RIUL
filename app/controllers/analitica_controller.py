"""Controlador de analitica (panel, ranking, insignias, indicadores) y consulta publica."""
from flask import request

from app.services import analitica_service, gamificacion_service, publico_service
from app.utils.auth import usuario_actual
from app.utils.response import ok


def dashboard():
    return ok(analitica_service.dashboard(usuario_actual()))


def ranking():
    return ok(gamificacion_service.ranking(request.args.get("tipo")))


def insignias():
    return ok(gamificacion_service.insignias_con_progreso(usuario_actual()))


def indicadores():
    return ok(analitica_service.indicadores())


def inicio_publico():
    return ok(publico_service.inicio())


def listado_publico(tipo):
    return ok(publico_service.listar(tipo))
