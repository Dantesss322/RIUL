"""Modelo Interaccion (tabla `interaccion`)."""
from datetime import datetime

from sqlalchemy import CheckConstraint, Computed, Enum, ForeignKey, Index, SmallInteger, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.models.usuario import Usuario
from app.utils.constantes import TIPOS_INTERACCION
from app.utils.fechas import ahora


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
