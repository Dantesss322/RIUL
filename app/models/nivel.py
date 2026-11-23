"""Modelo Nivel (tabla `nivel`)."""
from sqlalchemy import CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db


class Nivel(db.Model):
    """Umbral de XP de cada nivel (1 a 5 estrellas). La clave primaria es el propio nivel."""

    __tablename__ = "nivel"
    __table_args__ = (CheckConstraint("nivel BETWEEN 1 AND 5", name="ck_nivel_rango"),)

    nivel: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    xp_minimo: Mapped[int] = mapped_column(unique=True)
