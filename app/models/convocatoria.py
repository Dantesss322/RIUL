"""Modelo Convocatoria (tabla `convocatoria`)."""
from datetime import datetime

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db


class Convocatoria(db.Model):
    __tablename__ = "convocatoria"
    __table_args__ = (Index("ix_convocatoria_limite", "fecha_limite"),)

    id: Mapped[int] = mapped_column("id_convocatoria", primary_key=True)
    titulo: Mapped[str] = mapped_column(String(190))
    descripcion: Mapped[str] = mapped_column(Text)
    fecha_limite: Mapped[datetime]
    id_creador: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario"))
