"""Modelo Proyecto (tabla `proyecto`)."""
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.models.semillero import Semillero
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
