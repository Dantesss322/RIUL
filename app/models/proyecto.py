"""Proyectos de investigacion y sus avances (RF-2.3 a RF-2.5)."""
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Index, String, Text, func, select
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from app.estensions import db
from app.models.semillero import Semillero
from app.models.usuario import Usuario
from app.utils.constantes import ESTADOS_PROYECTO
from app.utils.fechas import ahora


class Proyecto(db.Model):
    __tablename__ = "proyecto"
    __table_args__ = (Index("ix_proyecto_semillero", "id_semillero", "estado"),)

    id: Mapped[int] = mapped_column("id_proyecto", primary_key=True)
    id_semillero: Mapped[int] = mapped_column(ForeignKey("semillero.id_semillero"))
    nombre: Mapped[str] = mapped_column(String(190))
    descripcion: Mapped[str] = mapped_column(Text)
    estado: Mapped[str] = mapped_column(Enum(*ESTADOS_PROYECTO, name="estado_proyecto"), default="activo")
    es_publico: Mapped[bool] = mapped_column(default=False)
    fecha_inicio: Mapped[datetime] = mapped_column(default=ahora)

    semillero: Mapped[Semillero] = relationship(lazy="joined")


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
