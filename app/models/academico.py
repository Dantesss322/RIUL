"""Estructura academica: facultades y programas."""
from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.estensions import db


class Facultad(db.Model):
    __tablename__ = "facultad"

    id: Mapped[int] = mapped_column("id_facultad", primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150), unique=True)


class Programa(db.Model):
    __tablename__ = "programa"
    __table_args__ = (UniqueConstraint("id_facultad", "nombre", name="uq_programa_facultad"),)

    id: Mapped[int] = mapped_column("id_programa", primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150))
    id_facultad: Mapped[int] = mapped_column(ForeignKey("facultad.id_facultad"))

    facultad: Mapped[Facultad] = relationship(lazy="joined")
