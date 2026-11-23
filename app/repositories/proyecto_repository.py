"""Consultas de proyectos y avances."""
from sqlalchemy import func, select

from app.estensions import db
from app.models import AvanceProyecto, Proyecto
from app.repositories.base import BaseRepository, mapa


class ProyectoRepository(BaseRepository):
    modelo = Proyecto

    @staticmethod
    def buscar(ids_semillero, texto="", estado=None):
        consulta = select(Proyecto).where(Proyecto.id_semillero.in_(ids_semillero)).order_by(Proyecto.id)
        if estado:
            consulta = consulta.where(Proyecto.estado == estado)
        if texto:
            consulta = consulta.where(Proyecto.nombre.ilike(f"%{texto.lower()}%"))
        return db.session.scalars(consulta).all()

    @staticmethod
    def de_semillero(id_semillero, solo_publicos=False):
        consulta = select(Proyecto).where(Proyecto.id_semillero == id_semillero).order_by(Proyecto.id)
        if solo_publicos:
            consulta = consulta.where(Proyecto.es_publico.is_(True))
        return db.session.scalars(consulta).all()

    @staticmethod
    def publicos():
        return db.session.scalars(select(Proyecto).where(Proyecto.es_publico.is_(True)).order_by(Proyecto.id)).all()

    @staticmethod
    def activos():
        return db.session.scalars(select(Proyecto).where(Proyecto.estado == "activo").order_by(Proyecto.id)).all()


class AvanceRepository(BaseRepository):
    modelo = AvanceProyecto

    @staticmethod
    def de_proyecto(id_proyecto):
        """Avances del proyecto, del mas reciente al mas antiguo."""
        return db.session.scalars(
            select(AvanceProyecto)
            .where(AvanceProyecto.id_proyecto == id_proyecto)
            .order_by(AvanceProyecto.fecha.desc(), AvanceProyecto.id.desc())
        ).all()

    @staticmethod
    def ultima_fecha_por_proyecto():
        """{id_proyecto: fecha del ultimo avance}."""
        return mapa(select(AvanceProyecto.id_proyecto, func.max(AvanceProyecto.fecha)).group_by(AvanceProyecto.id_proyecto))

    @staticmethod
    def ultima_fecha_por_semillero():
        """{id_semillero: fecha del ultimo avance de sus proyectos}."""
        return mapa(
            select(Proyecto.id_semillero, func.max(AvanceProyecto.fecha))
            .join(Proyecto, AvanceProyecto.id_proyecto == Proyecto.id)
            .group_by(Proyecto.id_semillero)
        )
