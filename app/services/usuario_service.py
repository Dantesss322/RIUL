"""Administracion de cuentas, perfil propio y hoja de vida (RF-1.4, RF-1.5, RF-4.6, RF-7.2)."""
from app.repositories.comunidad_repository import PublicacionRepository
from app.repositories.evento_repository import EventoRepository
from app.repositories.gamificacion_repository import LogroRepository, OtorgadaRepository
from app.repositories.proyecto_repository import ProyectoRepository
from app.repositories.semillero_repository import SemilleroRepository
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.usuario_schema import UsuarioSchema
from app.services.gamificacion_service import vista_insignia_obtenida
from app.services.permisos import obtener_o_404
from app.utils.constantes import ADMINISTRADOR, DOCENTE_LIDER
from app.utils.db import transaccional
from app.utils.errors import Conflicto, Prohibido
from app.utils.fechas import a_iso


def listar(estado=None, rol=None, texto=""):
    return UsuarioSchema(many=True).dump(UsuarioRepository.buscar(estado, rol, texto))


def estudiantes():
    """Estudiantes aprobados, para agregarlos como integrantes de un semillero."""
    return [
        {"id": u.id, "nombre": u.nombre, "programa": u.programa.nombre if u.programa else None}
        for u in UsuarioRepository.estudiantes_aprobados()
    ]


@transaccional
def actualizar_perfil(usuario, datos):
    UsuarioRepository.actualizar(usuario, datos)
    return UsuarioSchema().dump(usuario)


@transaccional
def cambiar_estado(administrador, id_usuario, estado):
    objetivo = obtener_o_404(UsuarioRepository, id_usuario, "El usuario")
    if objetivo.id == administrador.id:
        raise Conflicto("No puedes cambiar el estado de tu propia cuenta.")

    UsuarioRepository.actualizar(objetivo, {"estado": estado})
    return UsuarioSchema().dump(objetivo)


@transaccional
def cambiar_rol(administrador, id_usuario, rol):
    objetivo = obtener_o_404(UsuarioRepository, id_usuario, "El usuario")
    if objetivo.id == administrador.id:
        raise Conflicto("No puedes cambiar tu propio rol.")
    if objetivo.rol == DOCENTE_LIDER and rol != DOCENTE_LIDER and SemilleroRepository.lidera(objetivo.id):
        raise Conflicto("Antes de cambiar el rol, asigna otro líder a sus semilleros.")

    UsuarioRepository.actualizar(objetivo, {"rol": rol})
    return UsuarioSchema().dump(objetivo)


def _lidera_al_usuario(lider, objetivo):
    """El lider puede ver la hoja de vida de quienes pertenecen a su audiencia (integrantes y seguidores)."""
    return lider.rol == DOCENTE_LIDER and any(
        objetivo.id in SemilleroRepository.audiencia(semillero) for semillero in SemilleroRepository.buscar(ids=SemilleroRepository.ids_de(lider))
    )


def hoja_de_vida(solicitante, id_usuario):
    """Linea de tiempo con logros aprobados, publicaciones, eventos y proyectos, mas insignias y XP aportado."""
    objetivo = obtener_o_404(UsuarioRepository, id_usuario, "El usuario")
    if objetivo.id != solicitante.id and solicitante.rol != ADMINISTRADOR and not _lidera_al_usuario(solicitante, objetivo):
        raise Prohibido("No tienes permisos para ver esta hoja de vida.")

    ids_semillero = SemilleroRepository.ids_de(objetivo)
    nombres = {s.id: s.nombre for s in SemilleroRepository.buscar(ids=ids_semillero)}

    linea = [
        {
            "tipo": "logro",
            "titulo": logro.titulo,
            "detalle": f"{logro.tipo_logro.nombre} · {logro.semillero.nombre}",
            "xp": logro.xp_asignado,
            "fecha": logro.fecha_validacion or logro.fecha_registro,
        }
        for logro in LogroRepository.buscar(estado="aprobado", id_usuario=objetivo.id)
    ]
    linea += [
        {"tipo": "publicacion", "titulo": p.contenido[:90], "detalle": p.categoria, "fecha": p.fecha}
        for p in PublicacionRepository.publicadas_de(objetivo.id)
    ]
    linea += [
        {"tipo": "evento", "titulo": nombre, "detalle": "Participación en evento", "fecha": fecha}
        for nombre, fecha in EventoRepository.participaciones_de(objetivo.id)
    ]
    linea += [
        {"tipo": "proyecto", "titulo": p.nombre, "detalle": f"Proyecto · {p.semillero.nombre}", "fecha": p.fecha_inicio}
        for p in ProyectoRepository.buscar(ids_semillero)
    ]
    linea.sort(key=lambda item: item["fecha"], reverse=True)

    return {
        "usuario": UsuarioSchema().dump(objetivo),
        "semilleros": [nombres[id_] for id_ in ids_semillero],
        "xpAportado": int(LogroRepository.xp_de_usuario(objetivo.id)),
        "insignias": [vista_insignia_obtenida(i, f) for i, f in OtorgadaRepository.de_usuario(objetivo.id)],
        "linea": [{**item, "fecha": a_iso(item["fecha"])} for item in linea],
    }
