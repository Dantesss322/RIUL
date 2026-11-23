"""Modelo Notificacion (tabla `notificacion`)."""
from datetime import datetime

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db
from app.utils.fechas import ahora


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
