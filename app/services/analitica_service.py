"""Analitica (RF-6): panel de inicio por rol e indicadores institucionales para decidir."""
from app.models import Usuario
from app.repositories.academico_repository import FacultadRepository
from app.repositories.comunidad_repository import InteraccionRepository, PublicacionRepository
from app.repositories.evento_repository import ConvocatoriaRepository, EventoRepository, PostulacionRepository
from app.repositories.gamificacion_repository import LogroRepository, NivelRepository, OtorgadaRepository, TipoLogroRepository
from app.repositories.proyecto_repository import AvanceRepository, ProyectoRepository
from app.repositories.semillero_repository import IntegranteRepository, SemilleroRepository
from app.repositories.usuario_repository import UsuarioRepository
from app.services.gamificacion_service import ranking_semilleros, vista_insignia_obtenida
from app.utils.constantes import ADMINISTRADOR, DIAS_SIN_ACTIVIDAD, DOCENTE_LIDER
from app.utils.fechas import a_iso, dias_desde


def _porcentaje(parte, total):
    return int(parte / total * 100 + 0.5) if total else 0


def _promedio(valores):
    return int(sum(valores) / len(valores) + 0.5) if valores else 0


# --- Panel de inicio ---------------------------------------------------------------------------


def _actividad_reciente(ids_semillero):
    """Ultimos movimientos relevantes: logros aprobados y publicaciones de los semilleros indicados."""
    movimientos = [
        {"tipo": "logro", "texto": f'{l.usuario.nombre} logró "{l.titulo}" (+{l.xp_asignado} XP)', "fecha": l.fecha_validacion}
        for l in LogroRepository.aprobados_recientes(ids_semillero, 5)
    ]
    movimientos += [
        {"tipo": "publicacion", "texto": f"{p.autor.nombre} publicó en {p.categoria}", "fecha": p.fecha}
        for p in PublicacionRepository.recientes_publicadas(ids_semillero, 5)
    ]
    movimientos.sort(key=lambda m: m["fecha"], reverse=True)
    return [{**m, "fecha": a_iso(m["fecha"])} for m in movimientos[:5]]


def _dashboard_administrador():
    logros = LogroRepository.contar_por_estado()
    return {
        "rol": ADMINISTRADOR,
        "pendientes": {
            "cuentas": UsuarioRepository.contar(Usuario.estado == "pendiente"),
            "logros": logros.get("en_validacion", 0),
            "postulaciones": len(PostulacionRepository.buscar("pendiente")),
        },
        "totales": {
            "usuarios": UsuarioRepository.contar(Usuario.estado == "aprobado"),
            "semilleros": SemilleroRepository.contar(),
            "publicaciones": PublicacionRepository.contar_publicadas(),
            "logrosAprobados": logros.get("aprobado", 0),
        },
        "ranking": ranking_semilleros()[:3],
    }


def dashboard(usuario):
    """Resumen segun el rol, para cargar el panel con una sola peticion (RNF-2)."""
    if usuario.rol == ADMINISTRADOR:
        return _dashboard_administrador()

    ids = SemilleroRepository.ids_de(usuario)
    ranking = {fila["id"]: fila for fila in ranking_semilleros()}
    nombres = {s.id: s.nombre for s in SemilleroRepository.buscar(ids=ids)}

    if usuario.rol == DOCENTE_LIDER:
        pendientes = {
            "vinculaciones": len(IntegranteRepository.buscar("pendiente", ids_semillero=ids)),
            "publicaciones": PublicacionRepository.contar_pendientes(ids),
            "logros": LogroRepository.contar_pendientes_de_lider(ids),
        }
    else:
        pendientes = {
            "logros": LogroRepository.contar_en_curso_de(usuario.id),
            "solicitudes": len(IntegranteRepository.buscar("pendiente", id_usuario=usuario.id)),
        }

    return {
        "rol": usuario.rol,
        "semilleros": [
            {
                "id": id_,
                "nombre": nombres[id_],
                "progreso": {k: ranking[id_][k] for k in ("nivel", "xp", "xpSiguiente", "porcentaje", "nivelMaximo")},
                "posicion": ranking[id_]["posicion"],
                "totalSemilleros": len(ranking),
            }
            for id_ in ids
        ],
        "xpAportado": int(LogroRepository.xp_de_usuario(usuario.id)),
        "insignias": [vista_insignia_obtenida(i, f) for i, f in OtorgadaRepository.de_usuario(usuario.id)],
        "pendientes": pendientes,
        "actividad": _actividad_reciente(ids),
    }


# --- Indicadores institucionales -----------------------------------------------------------------


def _ultima_actividad():
    """{id_semillero: fecha de su ultimo logro, avance o publicacion}."""
    ultima = {}
    for fuente in (
        LogroRepository.ultima_fecha_por_semillero(),
        AvanceRepository.ultima_fecha_por_semillero(),
        PublicacionRepository.ultima_fecha_por_semillero(),
    ):
        for id_semillero, fecha in fuente.items():
            if fecha and (id_semillero not in ultima or fecha > ultima[id_semillero]):
                ultima[id_semillero] = fecha
    return ultima


def _vinculacion_por_facultad(facultades):
    """Estudiantes aprobados de cada facultad y cuantos estan vinculados a algun semillero."""
    estudiantes = UsuarioRepository.estudiantes_por_facultad()
    vinculados = IntegranteRepository.activos_por_usuario()
    filas = []
    for facultad in facultades:
        propios = [id_usuario for id_facultad, id_usuario in estudiantes if id_facultad == facultad.id]
        activos = sum(1 for id_usuario in propios if id_usuario in vinculados)
        filas.append(
            {"facultad": facultad.nombre, "estudiantes": len(propios), "vinculados": activos, "tasa": _porcentaje(activos, len(propios))}
        )
    return filas


def _proyectos_estancados():
    """Proyectos activos cuyo ultimo avance (o inicio) supera el umbral de inactividad."""
    ultimo_avance = AvanceRepository.ultima_fecha_por_proyecto()
    filas = [
        {
            "id": p.id,
            "nombre": p.nombre,
            "semillero": p.semillero.nombre,
            "diasSinAvance": dias_desde(ultimo_avance.get(p.id, p.fecha_inicio)),
        }
        for p in ProyectoRepository.activos()
    ]
    return [fila for fila in filas if fila["diasSinAvance"] > DIAS_SIN_ACTIVIDAD]


def _convocatorias():
    resumen = PostulacionRepository.resumen_por_convocatoria()
    filas = []
    for c in ConvocatoriaRepository.por_limite():
        total, aprobadas = resumen.get(c.id, (0, 0))
        filas.append({"titulo": c.titulo, "postulaciones": total, "aprobadas": aprobadas, "tasa": _porcentaje(aprobadas, total)})
    return filas


def indicadores():
    """Indicadores pensados para tomar decisiones, no solo para contar: cada bloque responde una pregunta de gestion."""
    semilleros = SemilleroRepository.listar()
    facultades = FacultadRepository.listar()
    logros = LogroRepository.contar_por_estado()
    aprobados, rechazados = logros.get("aprobado", 0), logros.get("rechazado", 0)

    ultima = _ultima_actividad()
    inactivos = [s for s in semilleros if s.id not in ultima or dias_desde(ultima[s.id]) > DIAS_SIN_ACTIVIDAD]
    productividad = LogroRepository.productividad_por_facultad()
    por_tipo = LogroRepository.aprobados_por_tipo()
    en_validacion = [dias_desde(fecha) for fecha in LogroRepository.fechas_en_validacion()]
    publicadas = PublicacionRepository.publicadas_por_semillero()
    interacciones = InteraccionRepository.por_semillero()
    nivel_de_cada_semillero = [fila["nivel"] for fila in ranking_semilleros()]

    return {
        "resumen": {
            "semillerosActivos": len(semilleros) - len(inactivos),
            "publicaciones": PublicacionRepository.contar_publicadas(),
            "logrosAprobados": aprobados,
            "convocatoriasAbiertas": ConvocatoriaRepository.contar_abiertas(),
        },
        "productividadPorFacultad": [
            {"facultad": f.nombre, "logros": productividad.get(f.id, (0, 0))[0], "xp": productividad.get(f.id, (0, 0))[1]}
            for f in facultades
        ],
        "productosPorTipo": [{"tipo": t.nombre, "total": por_tipo.get(t.id, 0)} for t in TipoLogroRepository.listar()],
        "vinculacionPorFacultad": _vinculacion_por_facultad(facultades),
        "semillerosInactivos": [
            {"id": s.id, "nombre": s.nombre, "diasSinActividad": dias_desde(ultima[s.id]) if s.id in ultima else None}
            for s in inactivos
        ],
        "proyectosEstancados": _proyectos_estancados(),
        "validacion": {
            "pendientes": len(en_validacion),
            "antiguedadPromedioDias": _promedio(en_validacion),
            "tasaAprobacion": _porcentaje(aprobados, aprobados + rechazados),
        },
        "convocatorias": _convocatorias(),
        "eventos": [
            {"nombre": e.nombre, "inscritos": e.inscritos, "cupos": e.cupos, "ocupacion": _porcentaje(e.inscritos, e.cupos)}
            for e in EventoRepository.por_fecha()
        ],
        "impactoPorSemillero": [
            {"nombre": s.nombre, "publicaciones": publicadas.get(s.id, 0), "interacciones": interacciones.get(s.id, 0)}
            for s in semilleros
        ],
        "distribucionNiveles": [
            {"nivel": n.nivel, "semilleros": nivel_de_cada_semillero.count(n.nivel)} for n in NivelRepository.por_xp()
        ],
    }
