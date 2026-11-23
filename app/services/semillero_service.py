"""Semilleros, integrantes, vinculaciones y seguimiento (RF-2.1, RF-2.2, RF-2.6, RF-2.7)."""
from app.models import Logro, Proyecto, Publicacion, SemilleroIntegrante
from app.repositories.gamificacion_repository import OtorgadaRepository
from app.repositories.proyecto_repository import ProyectoRepository
from app.repositories.semillero_repository import IntegranteRepository, SemilleroRepository
from app.repositories.usuario_repository import UsuarioRepository
from app.repositories.base import existe_referencia
from app.schemas.base_schema import vista
from app.schemas.proyecto_schema import ProyectoSchema
from app.schemas.semillero_schema import IntegranteSchema, SemilleroSchema
from app.services.gamificacion_service import progresos_de_semilleros, vista_insignia_obtenida
from app.services.notificacion_service import notificar
from app.services.permisos import es_lider_de, es_miembro_activo, gestiona, obtener_o_404, semillero_o_404
from app.utils.constantes import DOCENTE_LIDER, ESTUDIANTE
from app.utils.db import transaccional
from app.utils.errors import Conflicto, DatosInvalidos, Prohibido
from app.utils.fechas import ahora

# Tablas que impiden eliminar un semillero.
DEPENDIENTES = (
    (Proyecto, "proyectos"),
    (SemilleroIntegrante, "integrantes"),
    (Logro, "logros"),
    (Publicacion, "publicaciones"),
)


def _vistas(semilleros, usuario):
    """Semilleros con progreso (XP/nivel), si el usuario los sigue y su vinculo con cada uno."""
    progresos = progresos_de_semilleros([s.id for s in semilleros])
    seguidos = SemilleroRepository.seguidos_por(usuario.id)
    vinculos = IntegranteRepository.vinculos_de(usuario.id)
    return [
        vista(
            SemilleroSchema(),
            s,
            progreso=progresos[s.id],
            siguiendo=s.id in seguidos,
            vinculacion=(
                {"id": vinculos[s.id].id, "estado": vinculos[s.id].estado, "rol": vinculos[s.id].rol} if s.id in vinculos else None
            ),
            esLider=s.id_docente_lider == usuario.id,
        )
        for s in semilleros
    ]


def _validar_lider(id_docente_lider):
    lider = UsuarioRepository.obtener(id_docente_lider)
    if lider.rol != DOCENTE_LIDER:
        raise DatosInvalidos("El líder asignado debe tener el rol de docente líder.")


def listar(usuario, texto="", solo_propios=False):
    ids = SemilleroRepository.ids_de(usuario) if solo_propios else None
    return _vistas(SemilleroRepository.buscar(texto, ids), usuario)


def detalle(usuario, id_semillero):
    semillero = semillero_o_404(id_semillero)
    puede_gestionar = gestiona(usuario, semillero)
    ve_todo = puede_gestionar or es_miembro_activo(usuario, semillero.id)
    esquema = IntegranteSchema(many=True)

    return {
        **_vistas([semillero], usuario)[0],
        "integrantes": esquema.dump(IntegranteRepository.de_semillero(semillero.id, "activo")),
        "solicitudes": esquema.dump(IntegranteRepository.de_semillero(semillero.id, "pendiente")) if puede_gestionar else [],
        "proyectos": ProyectoSchema(many=True).dump(ProyectoRepository.de_semillero(semillero.id, solo_publicos=not ve_todo)),
        "insignias": [vista_insignia_obtenida(i, f) for i, f in OtorgadaRepository.de_semillero(semillero.id)],
        "seguidores": SemilleroRepository.contar_seguidores(semillero.id),
    }


@transaccional
def crear(datos):
    """Solo el administrador crea semilleros y asigna su lider (esa creacion es la validacion)."""
    _validar_lider(datos["id_docente_lider"])
    semillero = SemilleroRepository.crear(**datos)
    notificar(
        [semillero.id_docente_lider],
        "semillero",
        f'Fuiste asignado como líder del semillero "{semillero.nombre}".',
        f"/app/semilleros/{semillero.id}",
    )
    return SemilleroSchema().dump(semillero)


@transaccional
def actualizar(id_semillero, datos):
    semillero = semillero_o_404(id_semillero)
    if "id_docente_lider" in datos:
        _validar_lider(datos["id_docente_lider"])
    return SemilleroSchema().dump(SemilleroRepository.actualizar(semillero, datos))


@transaccional
def eliminar(id_semillero):
    semillero = semillero_o_404(id_semillero)
    for modelo, etiqueta in DEPENDIENTES:
        if existe_referencia(modelo, "id_semillero", semillero.id):
            raise Conflicto(f"No se puede eliminar: tiene {etiqueta} asociados.")
    SemilleroRepository.eliminar(semillero)


@transaccional
def seguir(usuario, id_semillero):
    SemilleroRepository.seguir(usuario.id, semillero_o_404(id_semillero).id)


@transaccional
def dejar_de_seguir(usuario, id_semillero):
    SemilleroRepository.dejar_de_seguir(usuario.id, id_semillero)


# --- Integrantes -----------------------------------------------------------------------------


@transaccional
def agregar_integrante(usuario, id_semillero, datos):
    semillero = semillero_o_404(id_semillero)
    if not gestiona(usuario, semillero):
        raise Prohibido("Solo el líder del semillero puede agregar integrantes.")

    candidato = UsuarioRepository.obtener(datos["id_usuario"])
    if candidato.rol != ESTUDIANTE or candidato.estado != "aprobado":
        raise DatosInvalidos("Solo se pueden agregar estudiantes con cuenta aprobada.")

    existente = IntegranteRepository.vinculo(semillero.id, candidato.id)
    if existente and existente.estado == "activo":
        raise Conflicto("Esa persona ya es integrante del semillero.")

    if existente:
        IntegranteRepository.actualizar(existente, {"estado": "activo", "rol": datos["rol"]})
    else:
        IntegranteRepository.crear(id_semillero=semillero.id, id_usuario=candidato.id, rol=datos["rol"], estado="activo")

    notificar([candidato.id], "vinculacion", f'Ahora eres integrante de "{semillero.nombre}".', f"/app/semilleros/{semillero.id}")


@transaccional
def cambiar_rol_integrante(usuario, id_integrante, rol):
    integrante = obtener_o_404(IntegranteRepository, id_integrante, "El integrante")
    if not gestiona(usuario, integrante.semillero):
        raise Prohibido("Solo el líder del semillero puede cambiar roles.")
    IntegranteRepository.actualizar(integrante, {"rol": rol})


@transaccional
def retirar_integrante(usuario, id_integrante):
    integrante = obtener_o_404(IntegranteRepository, id_integrante, "El integrante")
    if not gestiona(usuario, integrante.semillero):
        raise Prohibido("Solo el líder del semillero puede retirar integrantes.")
    IntegranteRepository.eliminar(integrante)


# --- Vinculaciones (solicitudes de ingreso) --------------------------------------------------


def listar_vinculaciones(usuario, estado=None):
    """Estudiante: sus propias solicitudes. Lider o administrador: las de sus semilleros."""
    if usuario.rol == ESTUDIANTE:
        filas = IntegranteRepository.buscar(estado, id_usuario=usuario.id)
    else:
        filas = IntegranteRepository.buscar(estado, ids_semillero=SemilleroRepository.ids_de(usuario))
    return IntegranteSchema(many=True).dump(filas)


@transaccional
def solicitar_vinculacion(usuario, id_semillero):
    semillero = semillero_o_404(id_semillero)
    existente = IntegranteRepository.vinculo(semillero.id, usuario.id)
    if existente and existente.estado == "activo":
        raise Conflicto("Ya eres integrante de este semillero.")
    if existente and existente.estado == "pendiente":
        raise Conflicto("Ya tienes una solicitud pendiente para este semillero.")

    datos = {"estado": "pendiente", "rol": "Joven investigador"}
    if existente:
        IntegranteRepository.actualizar(existente, datos)
    else:
        IntegranteRepository.crear(id_semillero=semillero.id, id_usuario=usuario.id, **datos)

    notificar(
        [semillero.id_docente_lider],
        "vinculacion",
        f'{usuario.nombre} solicitó vincularse a "{semillero.nombre}".',
        "/app/validaciones",
    )


@transaccional
def resolver_vinculacion(usuario, id_solicitud, estado):
    solicitud = obtener_o_404(IntegranteRepository, id_solicitud, "La solicitud")
    semillero = solicitud.semillero
    if not es_lider_de(usuario, semillero):
        raise Prohibido("Solo el líder del semillero puede resolver solicitudes.")

    cambios = {"estado": estado}
    if estado == "activo":
        cambios["fecha_ingreso"] = ahora()
    IntegranteRepository.actualizar(solicitud, cambios)

    notificar(
        [solicitud.id_usuario],
        "vinculacion",
        f'Tu solicitud fue aprobada: ya eres integrante de "{semillero.nombre}".'
        if estado == "activo"
        else f'Tu solicitud de vinculación a "{semillero.nombre}" no fue aprobada.',
        f"/app/semilleros/{semillero.id}",
    )
