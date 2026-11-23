"""Gamificacion (RF-4, RF-6.3): XP, niveles, insignias y rankings.

Reglas de negocio:
- El XP no se almacena: es la suma de `xp_asignado` de los logros aprobados.
- El nivel (1-5 estrellas) sale de comparar ese XP con los umbrales de la tabla `nivel`.
- Una insignia se obtiene al reunir N logros aprobados de un tipo (o de cualquiera).
"""
from collections import defaultdict

from app.repositories.gamificacion_repository import InsigniaRepository, LogroRepository, NivelRepository, OtorgadaRepository
from app.repositories.semillero_repository import SemilleroRepository
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.base_schema import vista
from app.schemas.gamificacion_schema import InsigniaSchema
from app.utils.constantes import ADMINISTRADOR


def progreso_por_xp(xp, niveles):
    """Nivel, XP y avance hacia el siguiente nivel; `niveles` va ordenado por umbral ascendente."""
    if not niveles:
        return {"nivel": 1, "xp": xp, "xpSiguiente": None, "porcentaje": 100, "nivelMaximo": 1}
    actual = next((n for n in reversed(niveles) if xp >= n.xp_minimo), niveles[0])
    siguiente = next((n for n in niveles if n.xp_minimo > xp), None)
    porcentaje = int((xp - actual.xp_minimo) / (siguiente.xp_minimo - actual.xp_minimo) * 100 + 0.5) if siguiente else 100
    return {
        "nivel": actual.nivel,
        "xp": xp,
        "xpSiguiente": siguiente.xp_minimo if siguiente else None,
        "porcentaje": porcentaje,
        "nivelMaximo": len(niveles),
    }


def progresos_de_semilleros(ids):
    """{id_semillero: progreso}, con una sola consulta de XP y de niveles para todos."""
    niveles = NivelRepository.por_xp()
    xp = LogroRepository.xp_por_semillero()
    return {id_: progreso_por_xp(int(xp.get(id_, 0)), niveles) for id_ in ids}


def progreso_de_semillero(id_semillero):
    return progresos_de_semilleros([id_semillero])[id_semillero]


def _cumple(insignia, por_tipo):
    logros = sum(por_tipo.values()) if insignia.id_tipo_logro is None else por_tipo.get(insignia.id_tipo_logro, 0)
    return logros, logros >= insignia.cantidad_requerida


def otorgar_insignias(id_usuario, id_semillero):
    """Otorga las insignias cuyas reglas ya se cumplen para la persona y su semillero.

    No confirma la transaccion. Devuelve las insignias nuevas como [{ambito, nombre}].
    """
    nuevas = []
    pares = (
        ("usuario", LogroRepository.aprobados_por_tipo(id_usuario=id_usuario), OtorgadaRepository.de_usuario(id_usuario)),
        ("semillero", LogroRepository.aprobados_por_tipo(id_semillero=id_semillero), OtorgadaRepository.de_semillero(id_semillero)),
    )
    for ambito, por_tipo, obtenidas in pares:
        ya = {insignia.id for insignia, _fecha in obtenidas}
        for insignia in InsigniaRepository.de_ambito(ambito):
            if insignia.id not in ya and _cumple(insignia, por_tipo)[1]:
                if ambito == "usuario":
                    OtorgadaRepository.otorgar_a_usuario(id_usuario, insignia.id)
                else:
                    OtorgadaRepository.otorgar_a_semillero(id_semillero, insignia.id)
                nuevas.append({"ambito": ambito, "nombre": insignia.nombre})
    return nuevas


def vista_insignia_obtenida(insignia, fecha):
    return vista(InsigniaSchema(), insignia, obtenida=True, fecha=fecha.isoformat() + "Z")


def insignias_con_progreso(usuario):
    """Catalogo de insignias con el avance hacia cada regla, para la persona y su semillero principal."""
    ids = SemilleroRepository.ids_de(usuario)

    def evaluar(ambito, por_tipo, obtenidas):
        fechas = {insignia.id: fecha for insignia, fecha in obtenidas}
        filas = []
        for insignia in InsigniaRepository.de_ambito(ambito):
            actual, _ = _cumple(insignia, por_tipo)
            fecha = fechas.get(insignia.id)
            filas.append(
                vista(
                    InsigniaSchema(),
                    insignia,
                    obtenida=insignia.id in fechas,
                    fecha=fecha.isoformat() + "Z" if fecha else None,
                    progreso={"actual": min(actual, insignia.cantidad_requerida), "requerido": insignia.cantidad_requerida},
                )
            )
        return filas

    return {
        "usuario": evaluar("usuario", LogroRepository.aprobados_por_tipo(id_usuario=usuario.id), OtorgadaRepository.de_usuario(usuario.id)),
        "semillero": (
            evaluar(
                "semillero",
                LogroRepository.aprobados_por_tipo(id_semillero=ids[0]),
                OtorgadaRepository.de_semillero(ids[0]),
            )
            if ids
            else []
        ),
    }


def ranking_semilleros():
    """Semilleros ordenados por XP, con nivel y progreso."""
    semilleros = SemilleroRepository.listar()
    progresos = progresos_de_semilleros([s.id for s in semilleros])
    logros = defaultdict(int)
    for _id, _usuario, id_semillero, *_ in LogroRepository.aprobados_filas():
        logros[id_semillero] += 1

    filas = [
        {"id": s.id, "nombre": s.nombre, "facultad": s.facultad.nombre, **progresos[s.id], "logros": logros[s.id]}
        for s in semilleros
    ]
    filas.sort(key=lambda fila: -fila["xp"])
    return [{**fila, "posicion": posicion} for posicion, fila in enumerate(filas, start=1)]


def ranking_investigadores():
    """Investigadores ordenados por el XP que aportaron con logros aprobados."""
    acumulado = {}
    for _id, id_usuario, id_semillero, _tipo, xp, _fecha in LogroRepository.aprobados_filas():
        fila = acumulado.setdefault(id_usuario, {"semillero": id_semillero, "xp": 0, "logros": 0})
        fila["xp"] += xp
        fila["logros"] += 1

    usuarios = UsuarioRepository.por_ids(list(acumulado))
    nombres_semillero = {s.id: s.nombre for s in SemilleroRepository.listar()}
    filas = [
        {"id": id_usuario, "nombre": usuarios[id_usuario].nombre, "semillero": nombres_semillero[datos["semillero"]], "xp": datos["xp"], "logros": datos["logros"]}
        for id_usuario, datos in acumulado.items()
        if usuarios[id_usuario].rol != ADMINISTRADOR and usuarios[id_usuario].estado == "aprobado"
    ]
    filas.sort(key=lambda fila: -fila["xp"])
    return [{**fila, "posicion": posicion} for posicion, fila in enumerate(filas, start=1)]


def ranking(tipo):
    return ranking_investigadores() if tipo == "investigadores" else ranking_semilleros()
