"""Modelo Publicacion (tabla `publicacion`)."""
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.models.usuario import Usuario
from app.models.semillero import Semillero
from app.utils.constantes import CATEGORIAS_PUBLICACION, ESTADOS_PUBLICACION
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
