"""Modelo AvanceProyecto (tabla `avance_proyecto`)."""
from datetime import datetime

from sqlalchemy import ForeignKey, Index, String, Text, func, select
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from app.extensions import db
from app.models.usuario import Usuario
from app.models.proyecto import Proyecto
from app.utils.fechas import ahora


class AvanceProyecto(db.Model):
    __tablename__ = "avance_proyecto"
    __table_args__ = (Index("ix_avance_proyecto", "id_proyecto", "fecha"),)

    id: Mapped[int] = mapped_column("id_avance", primary_key=True)
    id_proyecto: Mapped[int] = mapped_column(ForeignKey("proyecto.id_proyecto", ondelete="CASCADE"))
    id_autor: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario"))
    descripcion: Mapped[str] = mapped_column(Text)
    evidencia_url: Mapped[str | None] = mapped_column(String(255))
    fecha: Mapped[datetime] = mapped_column(default=ahora)

    autor: Mapped[Usuario] = relationship(lazy="joined")


Proyecto.total_avances = column_property(
    select(func.count(AvanceProyecto.id))
    .where(AvanceProyecto.id_proyecto == Proyecto.id)
    .correlate_except(AvanceProyecto)
    .scalar_subquery()
)
