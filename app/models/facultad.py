"""Modelo Facultad (tabla `facultad`)."""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db


class Facultad(db.Model):
    __tablename__ = "facultad"

    id: Mapped[int] = mapped_column("id_facultad", primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150), unique=True)
