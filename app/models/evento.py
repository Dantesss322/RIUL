"""Modelo Evento (tabla `evento`)."""
from datetime import datetime

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db
from app.utils.constantes import MODALIDADES


class Evento(db.Model):
    __tablename__ = "evento"
    __table_args__ = (CheckConstraint("cupos > 0", name="ck_evento_cupos"), Index("ix_evento_fecha", "fecha"))

    id: Mapped[int] = mapped_column("id_evento", primary_key=True)
    nombre: Mapped[str] = mapped_column(String(190))
    descripcion: Mapped[str] = mapped_column(Text)
    fecha: Mapped[datetime]
    lugar: Mapped[str] = mapped_column(String(190))
    modalidad: Mapped[str] = mapped_column(Enum(*MODALIDADES, name="modalidad_evento"))
    cupos: Mapped[int]
    id_creador: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario"))
