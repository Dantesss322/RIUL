"""Modelo Semillero (tabla `semillero`)."""
from datetime import datetime

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.models.facultad import Facultad
from app.models.usuario import Usuario
from app.utils.fechas import ahora


class Semillero(db.Model):
    __tablename__ = "semillero"

    id: Mapped[int] = mapped_column("id_semillero", primary_key=True)
    nombre: Mapped[str] = mapped_column(String(190), unique=True)
    descripcion: Mapped[str] = mapped_column(Text)
    id_facultad: Mapped[int] = mapped_column(ForeignKey("facultad.id_facultad"))
    id_docente_lider: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario"), index=True)
    creado_en: Mapped[datetime] = mapped_column("fecha_creacion", default=ahora)

    facultad: Mapped[Facultad] = relationship(lazy="joined")
    docente_lider: Mapped[Usuario] = relationship(lazy="joined")
