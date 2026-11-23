"""Flujo de un logro (RF-4.1 a RF-4.5).

    registrado --(lider envia)--> en_validacion --(administrador aprueba)--> aprobado

El lider puede devolver un logro `registrado` y el administrador rechazar uno `en_validacion`.
Al aprobar se congela el XP en `xp_asignado`, que se acumula en el semillero.
"""
from app.repositories.gamificacion_repository import LogroRepository
from app.repositories.semillero_repository import SemilleroRepository
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.gamificacion_schema import LogroSchema
from app.services.gamificacion_service import otorgar_insignias, progreso_de_semillero
from app.services.notificacion_service import notificar
from app.services.permisos import es_lider_de, es_miembro_activo, obtener_o_404, semillero_o_404
from app.utils.constantes import ADMINISTRADOR, ESTUDIANTE
from app.utils.db import transaccional
from app.utils.errors import Conflicto, Prohibido
from app.utils.fechas import ahora


def listar(usuario, estado=None, solo_propios=False):
    """Estudiante: sus logros. Lider: los de sus semilleros. Administrador: todos."""
    if usuario.rol == ESTUDIANTE:
        logros = LogroRepository.buscar(estado, id_usuario=usuario.id)
    else:
        logros = LogroRepository.buscar(
            estado, id_usuario=usuario.id if solo_propios else None, ids_semillero=SemilleroRepository.ids_de(usuario)
        )
    return LogroSchema(many=True).dump(logros)


@transaccional
def registrar(usuario, datos):
    """El lider es la autoridad del semillero: sus registros pasan directo a validacion."""
    semillero = semillero_o_404(datos["id_semillero"])
    es_lider = es_lider_de(usuario, semillero)
    if not es_lider and not es_miembro_activo(usuario, semillero.id):
        raise Prohibido("Solo los integrantes del semillero pueden registrar logros.")

    logro = LogroRepository.crear(id_usuario=usuario.id, estado="en_validacion" if es_lider else "registrado", **datos)
    if es_lider:
        notificar(
            UsuarioRepository.ids_aprobados(rol=ADMINISTRADOR),
            "logro",
            f'El semillero "{semillero.nombre}" envió un logro a validación.',
            "/app/validaciones",
        )
    else:
        notificar([semillero.id_docente_lider], "logro", f"{usuario.nombre} registró un logro para tu revisión.", "/app/validaciones")
    return LogroSchema().dump(logro)


@transaccional
def enviar_a_validacion(usuario, id_logro):
    logro = obtener_o_404(LogroRepository, id_logro, "El logro")
    if not es_lider_de(usuario, logro.semillero):
        raise Prohibido("Solo el líder del semillero puede enviar logros a validación.")
    if logro.estado != "registrado":
        raise Conflicto("Este logro ya no está pendiente de revisión del líder.")

    LogroRepository.actualizar(logro, {"estado": "en_validacion"})
    notificar(
        UsuarioRepository.ids_aprobados(rol=ADMINISTRADOR),
        "logro",
        f'El semillero "{logro.semillero.nombre}" envió un logro a validación.',
        "/app/validaciones",
    )


@transaccional
def aprobar(administrador, id_logro):
    """Aprueba el logro, asigna el XP al semillero, otorga insignias y notifica. Todo o nada."""
    logro = obtener_o_404(LogroRepository, id_logro, "El logro")
    if logro.estado != "en_validacion":
        raise Conflicto("Solo se pueden aprobar logros en validación.")

    semillero = logro.semillero
    nivel_antes = progreso_de_semillero(semillero.id)["nivel"]
    LogroRepository.actualizar(
        logro,
        {"estado": "aprobado", "xp_asignado": logro.tipo_logro.xp, "id_validador": administrador.id, "fecha_validacion": ahora()},
    )
    nivel_despues = progreso_de_semillero(semillero.id)["nivel"]
    insignias = otorgar_insignias(logro.id_usuario, semillero.id)

    notificar(
        [logro.id_usuario, semillero.id_docente_lider],
        "logro",
        f'Logro aprobado: "{logro.titulo}" suma {logro.xp_asignado} XP a "{semillero.nombre}".',
        "/app/logros",
    )
    subio = nivel_despues > nivel_antes
    if subio:
        notificar(
            [semillero.id_docente_lider, logro.id_usuario],
            "nivel",
            f'"{semillero.nombre}" alcanzó el nivel {nivel_despues}.',
            "/app/ranking",
        )

    extras = []
    if subio:
        extras.append(f"El semillero subió al nivel {nivel_despues}.")
    if insignias:
        extras.append(f"Nuevas insignias: {', '.join(i['nombre'] for i in insignias)}.")
    mensaje = " ".join([f"Logro aprobado: +{logro.xp_asignado} XP para el semillero.", *extras])
    return LogroSchema().dump(logro), mensaje


@transaccional
def rechazar(usuario, id_logro, motivo):
    logro = obtener_o_404(LogroRepository, id_logro, "El logro")
    lider_revisa = es_lider_de(usuario, logro.semillero) and logro.estado == "registrado"
    admin_valida = usuario.rol == ADMINISTRADOR and logro.estado == "en_validacion"
    if not (lider_revisa or admin_valida):
        raise Prohibido("No puedes rechazar este logro en su estado actual.")

    LogroRepository.actualizar(
        logro, {"estado": "rechazado", "motivo_rechazo": motivo, "id_validador": usuario.id, "fecha_validacion": ahora()}
    )
    notificar([logro.id_usuario], "logro", f'Tu logro "{logro.titulo}" no fue aprobado. Motivo: {motivo}', "/app/logros")
