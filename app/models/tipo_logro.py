"""Modelo TipoLogro (tabla `tipo_logro`)."""
from sqlalchemy import CheckConstraint, String
from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db


class TipoLogro(db.Model):
    __tablename__ = "tipo_logro"
    __table_args__ = (CheckConstraint("xp > 0", name="ck_tipo_logro_xp"),)

    id: Mapped[int] = mapped_column("id_tipo_logro", primary_key=True)
    nombre: Mapped[str] = mapped_column(String(60), unique=True)
    xp: Mapped[int]
