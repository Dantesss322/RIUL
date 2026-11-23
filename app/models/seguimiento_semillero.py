"""Modelo SeguimientoSemillero (tabla `seguimiento_semillero`)."""
from datetime import datetime

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db
from app.utils.fechas import ahora


class SeguimientoSemillero(db.Model):
    __tablename__ = "seguimiento_semillero"

    id_usuario: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario", ondelete="CASCADE"), primary_key=True)
    id_semillero: Mapped[int] = mapped_column(
        ForeignKey("semillero.id_semillero", ondelete="CASCADE"), primary_key=True, index=True
    )
    fecha: Mapped[datetime] = mapped_column(default=ahora)
