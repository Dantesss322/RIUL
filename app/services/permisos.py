"""Reglas de pertenencia compartidas por los servicios: quien lidera, gestiona o integra un semillero."""
from app.repositories.base import BaseRepository
from app.repositories.semillero_repository import IntegranteRepository, SemilleroRepository
from app.utils.constantes import ADMINISTRADOR, DOCENTE_LIDER
from app.utils.errors import NoEncontrado


def semillero_o_404(id_semillero):
    semillero = SemilleroRepository.obtener(id_semillero)
    if semillero is None:
        raise NoEncontrado("El semillero")
    return semillero


def obtener_o_404(repositorio: type[BaseRepository], id_, que):
    """Busca por id y lanza 404 con el nombre del recurso ("El proyecto", "La publicación"...)."""
    objeto = repositorio.obtener(id_)
    if objeto is None:
        raise NoEncontrado(que)
    return objeto


def es_lider_de(usuario, semillero):
    return usuario.rol == DOCENTE_LIDER and semillero.id_docente_lider == usuario.id


def gestiona(usuario, semillero):
    """El administrador y el lider del semillero pueden gestionarlo."""
    return usuario.rol == ADMINISTRADOR or es_lider_de(usuario, semillero)


def es_miembro_activo(usuario, id_semillero):
    return IntegranteRepository.es_activo(id_semillero, usuario.id)
