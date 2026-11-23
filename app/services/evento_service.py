"""Eventos institucionales, convocatorias y postulaciones (RF-2.8, RF-5.1 a RF-5.3).

El CRUD basico de eventos y convocatorias (editar, eliminar) lo da `catalogo_service`; aqui van las reglas propias.
"""
from app.repositories.evento_repository import ConvocatoriaRepository, EventoRepository, PostulacionRepository
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.base_schema import vista
from app.schemas.evento_schema import ConvocatoriaSchema, EventoSchema, PostulacionSchema
from app.services.notificacion_service import notificar
from app.services.permisos import obtener_o_404
from app.utils.constantes import ADMINISTRADOR
from app.utils.db import transaccional
from app.utils.errors import Conflicto, NoEncontrado
from app.utils.fechas import ahora


def listar_eventos(usuario):
    inscrito_en = EventoRepository.inscritos_en(usuario.id)
    return [vista(EventoSchema(), e, inscrito=e.id in inscrito_en) for e in EventoRepository.por_fecha()]


@transaccional
def participar(usuario, id_evento):
    evento = EventoRepository.obtener_bloqueado(id_evento)
    if evento is None:
        raise NoEncontrado("El evento")
    if evento.fecha <= ahora():
        raise Conflicto("Este evento ya finalizó.")
    if EventoRepository.participacion(evento.id, usuario.id):
        raise Conflicto("Ya registraste tu participación en este evento.")
    if evento.inscritos >= evento.cupos:
        raise Conflicto("Este evento ya no tiene cupos disponibles.")

    EventoRepository.inscribir(evento.id, usuario.id)
    return evento.nombre


def listar_convocatorias(usuario):
    mis_postulaciones = PostulacionRepository.de_usuario(usuario.id)
    return [
        vista(ConvocatoriaSchema(), c, miPostulacion=mis_postulaciones.get(c.id))
        for c in ConvocatoriaRepository.por_limite()
    ]


@transaccional
def crear_convocatoria(administrador, datos):
    """Al publicarla se notifica a toda la comunidad (cuentas aprobadas que no son administradores)."""
    convocatoria = ConvocatoriaRepository.crear(id_creador=administrador.id, **datos)
    notificar(
        UsuarioRepository.ids_aprobados_no_admin(),
        "convocatoria",
        f"Nueva convocatoria: {convocatoria.titulo}.",
        "/app/eventos",
    )
    return ConvocatoriaSchema().dump(convocatoria)


@transaccional
def postular(usuario, id_convocatoria):
    convocatoria = obtener_o_404(ConvocatoriaRepository, id_convocatoria, "La convocatoria")
    if convocatoria.fecha_limite <= ahora():
        raise Conflicto("Esta convocatoria ya cerró.")
    if PostulacionRepository.existente(convocatoria.id, usuario.id):
        raise Conflicto("Ya te postulaste a esta convocatoria.")

    PostulacionRepository.crear(id_convocatoria=convocatoria.id, id_usuario=usuario.id)
    notificar(
        UsuarioRepository.ids_aprobados(rol=ADMINISTRADOR),
        "postulacion",
        f'{usuario.nombre} se postuló a "{convocatoria.titulo}".',
        "/app/validaciones",
    )


def listar_postulaciones(estado=None):
    return PostulacionSchema(many=True).dump(PostulacionRepository.buscar(estado))


@transaccional
def resolver_postulacion(id_postulacion, estado):
    postulacion = obtener_o_404(PostulacionRepository, id_postulacion, "La postulación")
    PostulacionRepository.actualizar(postulacion, {"estado": estado})
    notificar(
        [postulacion.id_usuario],
        "postulacion",
        f'Tu postulación a "{postulacion.convocatoria.titulo}" fue {"aprobada" if estado == "aprobada" else "rechazada"}.',
        "/app/eventos",
    )
