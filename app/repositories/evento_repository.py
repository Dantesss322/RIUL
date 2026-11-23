"""Consultas de eventos, convocatorias y postulaciones."""
from sqlalchemy import case, func, select

from app.extensions import db
from app.models import Convocatoria, Evento, EventoParticipante, Postulacion
from app.repositories.base import BaseRepository, mapa
from app.utils.fechas import ahora


class EventoRepository(BaseRepository):
    modelo = Evento

    @staticmethod
    def por_fecha():
        return db.session.scalars(select(Evento).order_by(Evento.fecha, Evento.id)).all()

    @staticmethod
    def proximos():
        return db.session.scalars(select(Evento).where(Evento.fecha > ahora()).order_by(Evento.fecha, Evento.id)).all()

    @staticmethod
    def obtener_bloqueado(id_evento):
        """Evento con su fila bloqueada hasta confirmar: evita que dos inscripciones simultaneas excedan los cupos."""
        return db.session.scalar(select(Evento).where(Evento.id == id_evento).with_for_update())

    @staticmethod
    def participaciones_de(id_usuario):
        """[(nombre del evento, fecha de registro)] de las participaciones de una persona."""
        return db.session.execute(
            select(Evento.nombre, EventoParticipante.fecha_registro)
            .join(Evento, EventoParticipante.id_evento == Evento.id)
            .where(EventoParticipante.id_usuario == id_usuario)
        ).all()

    @staticmethod
    def inscritos_en(id_usuario):
        """Ids de los eventos en los que la persona ya registro su participacion."""
        return set(db.session.scalars(select(EventoParticipante.id_evento).where(EventoParticipante.id_usuario == id_usuario)))

    @staticmethod
    def participacion(id_evento, id_usuario):
        return db.session.get(EventoParticipante, (id_evento, id_usuario))

    @staticmethod
    def inscribir(id_evento, id_usuario):
        db.session.add(EventoParticipante(id_evento=id_evento, id_usuario=id_usuario))
        db.session.flush()


class ConvocatoriaRepository(BaseRepository):
    modelo = Convocatoria

    @staticmethod
    def por_limite():
        return db.session.scalars(select(Convocatoria).order_by(Convocatoria.fecha_limite, Convocatoria.id)).all()

    @staticmethod
    def contar_abiertas():
        return ConvocatoriaRepository.contar(Convocatoria.fecha_limite > ahora())


class PostulacionRepository(BaseRepository):
    modelo = Postulacion

    @staticmethod
    def buscar(estado=None):
        consulta = select(Postulacion).order_by(Postulacion.id)
        if estado:
            consulta = consulta.where(Postulacion.estado == estado)
        return db.session.scalars(consulta).all()

    @staticmethod
    def de_usuario(id_usuario):
        """{id_convocatoria: estado} de las postulaciones de una persona."""
        return mapa(select(Postulacion.id_convocatoria, Postulacion.estado).where(Postulacion.id_usuario == id_usuario))

    @staticmethod
    def existente(id_convocatoria, id_usuario):
        return db.session.scalar(
            select(Postulacion).where(Postulacion.id_convocatoria == id_convocatoria, Postulacion.id_usuario == id_usuario)
        )

    @staticmethod
    def resumen_por_convocatoria():
        """{id_convocatoria: (total, aprobadas)}."""
        filas = db.session.execute(
            select(
                Postulacion.id_convocatoria,
                func.count(),
                func.coalesce(func.sum(case((Postulacion.estado == "aprobada", 1), else_=0)), 0),
            ).group_by(Postulacion.id_convocatoria)
        )
        return {id_: (total, int(aprobadas)) for id_, total, aprobadas in filas}
