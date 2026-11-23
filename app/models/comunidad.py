"""Comunidad (RF-3): publicaciones, interacciones y notificaciones."""
from datetime import datetime

from sqlalchemy import CheckConstraint, Computed, Enum, ForeignKey, Index, SmallInteger, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.estensions import db
from app.models.semillero import Semillero
from app.models.usuario import Usuario
from app.utils.constantes import CATEGORIAS_PUBLICACION, ESTADOS_PUBLICACION, TIPOS_INTERACCION
from app.utils.fechas import ahora


class Publicacion(db.Model):
    """Las publicaciones de estudiantes nacen `pendiente` y las aprueba el lider del semillero."""

    __tablename__ = "publicacion"
    __table_args__ = (
        Index("ix_publicacion_estado_fecha", "estado", "fecha"),
        Index("ix_publicacion_semillero", "id_semillero", "estado"),
    )

    id: Mapped[int] = mapped_column("id_publicacion", primary_key=True)
    id_usuario: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario"))
    id_semillero: Mapped[int] = mapped_column(ForeignKey("semillero.id_semillero"))
    categoria: Mapped[str] = mapped_column(Enum(*CATEGORIAS_PUBLICACION, name="categoria_publicacion"))
    contenido: Mapped[str] = mapped_column(Text)
    evidencia_url: Mapped[str | None] = mapped_column(String(255))
    estado: Mapped[str] = mapped_column(Enum(*ESTADOS_PUBLICACION, name="estado_publicacion"), default="pendiente")
    es_publico: Mapped[bool] = mapped_column(default=False)
    fecha: Mapped[datetime] = mapped_column(default=ahora)

    autor: Mapped[Usuario] = relationship(lazy="joined")
    semillero: Mapped[Semillero] = relationship(lazy="joined")


class Interaccion(db.Model):
    """Reacciones, comentarios y compartidos en una sola tabla.

    `reaccion_unica` (columna generada) vale 1 solo en las reacciones: junto al indice UNIQUE
    garantiza una reaccion por usuario y publicacion sin limitar los comentarios.
    """

    __tablename__ = "interaccion"
    __table_args__ = (
        UniqueConstraint("id_publicacion", "id_usuario", "reaccion_unica", name="uq_interaccion_reaccion"),
        CheckConstraint("tipo <> 'comentario' OR contenido IS NOT NULL", name="ck_interaccion_comentario"),
        Index("ix_interaccion_publicacion", "id_publicacion", "tipo"),
    )

    id: Mapped[int] = mapped_column("id_interaccion", primary_key=True)
    id_publicacion: Mapped[int] = mapped_column(ForeignKey("publicacion.id_publicacion", ondelete="CASCADE"))
    id_usuario: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario"))
    tipo: Mapped[str] = mapped_column(Enum(*TIPOS_INTERACCION, name="tipo_interaccion"))
    contenido: Mapped[str | None] = mapped_column(Text)
    fecha: Mapped[datetime] = mapped_column(default=ahora)
    reaccion_unica: Mapped[int | None] = mapped_column(
        SmallInteger, Computed("CASE WHEN tipo = 'reaccion' THEN 1 ELSE NULL END", persisted=False)
    )

    autor: Mapped[Usuario] = relationship(lazy="joined")


class Notificacion(db.Model):
    __tablename__ = "notificacion"
    __table_args__ = (Index("ix_notificacion_usuario", "id_usuario", "leida", "fecha"),)

    id: Mapped[int] = mapped_column("id_notificacion", primary_key=True)
    id_usuario: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario", ondelete="CASCADE"))
    tipo: Mapped[str] = mapped_column(String(30))
    mensaje: Mapped[str] = mapped_column(String(255))
    ruta: Mapped[str] = mapped_column(String(190))
    leida: Mapped[bool] = mapped_column(default=False)
    fecha: Mapped[datetime] = mapped_column(default=ahora)
