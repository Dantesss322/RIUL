"""Consultas de la comunidad: publicaciones, interacciones y notificaciones."""
from sqlalchemy import func, or_, select, update

from app.extensions import db
from app.models import Interaccion, Notificacion, Publicacion
from app.repositories.base import BaseRepository, mapa


class PublicacionRepository(BaseRepository):
    modelo = Publicacion

    @staticmethod
    def feed(usuario_id, categoria=None, id_semillero=None):
        """Publicaciones aprobadas de cualquier semillero mas las propias en cualquier estado."""
        consulta = (
            select(Publicacion)
            .where(or_(Publicacion.estado == "publicada", Publicacion.id_usuario == usuario_id))
            .order_by(Publicacion.fecha.desc(), Publicacion.id.desc())
        )
        return PublicacionRepository._filtrar(consulta, categoria, id_semillero)

    @staticmethod
    def pendientes(ids_semillero, categoria=None, id_semillero=None):
        """Publicaciones por moderar en los semilleros indicados."""
        consulta = (
            select(Publicacion)
            .where(Publicacion.estado == "pendiente", Publicacion.id_semillero.in_(ids_semillero))
            .order_by(Publicacion.fecha.desc(), Publicacion.id.desc())
        )
        return PublicacionRepository._filtrar(consulta, categoria, id_semillero)

    @staticmethod
    def _filtrar(consulta, categoria, id_semillero):
        if categoria:
            consulta = consulta.where(Publicacion.categoria == categoria)
        if id_semillero is not None:
            consulta = consulta.where(Publicacion.id_semillero == id_semillero)
        return db.session.scalars(consulta).all()

    @staticmethod
    def publicadas_de(id_usuario):
        return db.session.scalars(
            select(Publicacion).where(Publicacion.id_usuario == id_usuario, Publicacion.estado == "publicada")
        ).all()

    @staticmethod
    def publicas_recientes(limite):
        return db.session.scalars(
            select(Publicacion)
            .where(Publicacion.estado == "publicada", Publicacion.es_publico.is_(True))
            .order_by(Publicacion.fecha.desc(), Publicacion.id.desc())
            .limit(limite)
        ).all()

    @staticmethod
    def recientes_publicadas(ids_semillero, limite):
        return db.session.scalars(
            select(Publicacion)
            .where(Publicacion.estado == "publicada", Publicacion.id_semillero.in_(ids_semillero))
            .order_by(Publicacion.fecha.desc())
            .limit(limite)
        ).all()

    @staticmethod
    def contar_publicadas():
        return PublicacionRepository.contar(Publicacion.estado == "publicada")

    @staticmethod
    def contar_pendientes(ids_semillero):
        return PublicacionRepository.contar(Publicacion.estado == "pendiente", Publicacion.id_semillero.in_(ids_semillero))

    @staticmethod
    def ultima_fecha_por_semillero():
        return mapa(select(Publicacion.id_semillero, func.max(Publicacion.fecha)).group_by(Publicacion.id_semillero))

    @staticmethod
    def publicadas_por_semillero():
        return mapa(
            select(Publicacion.id_semillero, func.count()).where(Publicacion.estado == "publicada").group_by(Publicacion.id_semillero)
        )


class InteraccionRepository(BaseRepository):
    modelo = Interaccion

    @staticmethod
    def conteos(ids_publicacion):
        """{id_publicacion: {tipo: cantidad}} de reacciones, comentarios y compartidos."""
        filas = db.session.execute(
            select(Interaccion.id_publicacion, Interaccion.tipo, func.count())
            .where(Interaccion.id_publicacion.in_(ids_publicacion))
            .group_by(Interaccion.id_publicacion, Interaccion.tipo)
        )
        resultado = {}
        for id_publicacion, tipo, cantidad in filas:
            resultado.setdefault(id_publicacion, {})[tipo] = cantidad
        return resultado

    @staticmethod
    def reaccionadas_por(id_usuario, ids_publicacion):
        return set(
            db.session.scalars(
                select(Interaccion.id_publicacion).where(
                    Interaccion.id_usuario == id_usuario,
                    Interaccion.tipo == "reaccion",
                    Interaccion.id_publicacion.in_(ids_publicacion),
                )
            )
        )

    @staticmethod
    def reaccion(id_publicacion, id_usuario):
        return db.session.scalar(
            select(Interaccion).where(
                Interaccion.id_publicacion == id_publicacion, Interaccion.id_usuario == id_usuario, Interaccion.tipo == "reaccion"
            )
        )

    @staticmethod
    def comentarios(id_publicacion):
        return db.session.scalars(
            select(Interaccion)
            .where(Interaccion.id_publicacion == id_publicacion, Interaccion.tipo == "comentario")
            .order_by(Interaccion.id)
        ).all()

    @staticmethod
    def por_semillero():
        """{id_semillero: interacciones} sobre las publicaciones publicadas de cada semillero."""
        return mapa(
            select(Publicacion.id_semillero, func.count(Interaccion.id))
            .join(Publicacion, Interaccion.id_publicacion == Publicacion.id)
            .where(Publicacion.estado == "publicada")
            .group_by(Publicacion.id_semillero)
        )


class NotificacionRepository(BaseRepository):
    modelo = Notificacion

    @staticmethod
    def de_usuario(id_usuario):
        return db.session.scalars(
            select(Notificacion)
            .where(Notificacion.id_usuario == id_usuario)
            .order_by(Notificacion.fecha.desc(), Notificacion.id.desc())
        ).all()

    @staticmethod
    def contar_no_leidas(id_usuario):
        return NotificacionRepository.contar(Notificacion.id_usuario == id_usuario, Notificacion.leida.is_(False))

    @staticmethod
    def marcar_todas_leidas(id_usuario):
        db.session.execute(update(Notificacion).where(Notificacion.id_usuario == id_usuario).values(leida=True))

    @staticmethod
    def agregar(destinatarios, tipo, mensaje, ruta):
        """Una notificacion por destinatario."""
        db.session.add_all(Notificacion(id_usuario=id_, tipo=tipo, mensaje=mensaje[:255], ruta=ruta) for id_ in destinatarios)
