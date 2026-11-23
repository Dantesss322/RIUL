"""Modelo SemilleroInsignia (tabla `semillero_insignia`)."""
from datetime import datetime

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db
from app.utils.fechas import ahora


class SemilleroInsignia(db.Model):
    __tablename__ = "semillero_insignia"

    id_semillero: Mapped[int] = mapped_column(ForeignKey("semillero.id_semillero", ondelete="CASCADE"), primary_key=True)
    id_insignia: Mapped[int] = mapped_column(ForeignKey("insignia.id_insignia"), primary_key=True)
    fecha_obtenida: Mapped[datetime] = mapped_column(default=ahora)
