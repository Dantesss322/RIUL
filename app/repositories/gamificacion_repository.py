"""Consultas de gamificacion: tipos de logro, niveles, insignias y logros."""
from sqlalchemy import func, select

from app.extensions import db
from app.models import Insignia, Logro, Nivel, Semillero, SemilleroInsignia, TipoLogro, UsuarioInsignia
from app.repositories.base import BaseRepository, mapa


class TipoLogroRepository(BaseRepository):
    modelo = TipoLogro


class NivelRepository(BaseRepository):
    modelo = Nivel

    @staticmethod
    def por_xp():
        """Niveles de menor a mayor umbral de XP."""
        return db.session.scalars(select(Nivel).order_by(Nivel.xp_minimo)).all()


class InsigniaRepository(BaseRepository):
    modelo = Insignia

    @staticmethod
    def de_ambito(ambito):
        return db.session.scalars(select(Insignia).where(Insignia.ambito == ambito).order_by(Insignia.id)).all()


class OtorgadaRepository:
    """Insignias ya obtenidas por usuarios y semilleros."""

    @staticmethod
    def de_usuario(id_usuario):
        """[(insignia, fecha de obtencion)] de una persona."""
        return db.session.execute(
            select(Insignia, UsuarioInsignia.fecha_obtenida)
            .join(UsuarioInsignia, UsuarioInsignia.id_insignia == Insignia.id)
            .where(UsuarioInsignia.id_usuario == id_usuario)
            .order_by(UsuarioInsignia.fecha_obtenida, Insignia.id)
        ).all()

    @staticmethod
    def de_semillero(id_semillero):
        """[(insignia, fecha de obtencion)] de un semillero."""
        return db.session.execute(
            select(Insignia, SemilleroInsignia.fecha_obtenida)
            .join(SemilleroInsignia, SemilleroInsignia.id_insignia == Insignia.id)
            .where(SemilleroInsignia.id_semillero == id_semillero)
            .order_by(SemilleroInsignia.fecha_obtenida, Insignia.id)
        ).all()

    @staticmethod
    def otorgar_a_usuario(id_usuario, id_insignia):
        db.session.add(UsuarioInsignia(id_usuario=id_usuario, id_insignia=id_insignia))

    @staticmethod
    def otorgar_a_semillero(id_semillero, id_insignia):
        db.session.add(SemilleroInsignia(id_semillero=id_semillero, id_insignia=id_insignia))


class LogroRepository(BaseRepository):
    modelo = Logro

    @staticmethod
    def buscar(estado=None, id_usuario=None, ids_semillero=None):
        """Logros del mas reciente al mas antiguo, filtrados por estado, autor o semilleros."""
        consulta = select(Logro).order_by(Logro.fecha_registro.desc(), Logro.id.desc())
        if estado:
            consulta = consulta.where(Logro.estado == estado)
        if id_usuario is not None:
            consulta = consulta.where(Logro.id_usuario == id_usuario)
        if ids_semillero is not None:
            consulta = consulta.where(Logro.id_semillero.in_(ids_semillero))
        return db.session.scalars(consulta).all()

    @staticmethod
    def de_proyecto(id_proyecto):
        return db.session.scalars(select(Logro).where(Logro.id_proyecto == id_proyecto).order_by(Logro.id)).all()

    @staticmethod
    def aprobados_filas():
        """(id, id_usuario, id_semillero, id_tipo_logro, xp_asignado, fecha_validacion) de los logros aprobados."""
        return db.session.execute(
            select(Logro.id, Logro.id_usuario, Logro.id_semillero, Logro.id_tipo_logro, Logro.xp_asignado, Logro.fecha_validacion)
            .where(Logro.estado == "aprobado")
            .order_by(Logro.id)
        ).all()

    @staticmethod
    def xp_por_semillero():
        """{id_semillero: XP acumulado} con los logros aprobados."""
        return mapa(
            select(Logro.id_semillero, func.sum(Logro.xp_asignado)).where(Logro.estado == "aprobado").group_by(Logro.id_semillero)
        )

    @staticmethod
    def aprobados_recientes(ids_semillero, limite):
        return db.session.scalars(
            select(Logro)
            .where(Logro.estado == "aprobado", Logro.id_semillero.in_(ids_semillero))
            .order_by(Logro.fecha_validacion.desc())
            .limit(limite)
        ).all()

    @staticmethod
    def productividad_por_facultad():
        """{id_facultad: (logros aprobados, XP)}."""
        filas = db.session.execute(
            select(Semillero.id_facultad, func.count(), func.sum(Logro.xp_asignado))
            .join(Semillero, Logro.id_semillero == Semillero.id)
            .where(Logro.estado == "aprobado")
            .group_by(Semillero.id_facultad)
        )
        return {id_: (total, int(xp)) for id_, total, xp in filas}

    @staticmethod
    def xp_de_usuario(id_usuario):
        return db.session.scalar(
            select(func.coalesce(func.sum(Logro.xp_asignado), 0)).where(Logro.estado == "aprobado", Logro.id_usuario == id_usuario)
        )

    @staticmethod
    def aprobados_por_tipo(id_usuario=None, id_semillero=None):
        """{id_tipo_logro: cantidad} de logros aprobados de una persona o de un semillero."""
        consulta = select(Logro.id_tipo_logro, func.count()).where(Logro.estado == "aprobado").group_by(Logro.id_tipo_logro)
        if id_usuario is not None:
            consulta = consulta.where(Logro.id_usuario == id_usuario)
        if id_semillero is not None:
            consulta = consulta.where(Logro.id_semillero == id_semillero)
        return mapa(consulta)

    @staticmethod
    def contar_por_estado():
        """{estado: cantidad} de todos los logros."""
        return mapa(select(Logro.estado, func.count()).group_by(Logro.estado))

    @staticmethod
    def fechas_en_validacion():
        return db.session.scalars(select(Logro.fecha_registro).where(Logro.estado == "en_validacion")).all()

    @staticmethod
    def ultima_fecha_por_semillero():
        return mapa(select(Logro.id_semillero, func.max(Logro.fecha_registro)).group_by(Logro.id_semillero))

    @staticmethod
    def contar_pendientes_de_lider(ids_semillero):
        return LogroRepository.contar(Logro.id_semillero.in_(ids_semillero), Logro.estado == "registrado")

    @staticmethod
    def contar_en_curso_de(id_usuario):
        return LogroRepository.contar(Logro.id_usuario == id_usuario, Logro.estado.in_(("registrado", "en_validacion")))
