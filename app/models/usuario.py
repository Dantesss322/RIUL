"""Usuarios de la plataforma (RF-1).

La solicitud de registro es un usuario en estado `pendiente`; no existe una tabla aparte.
"""
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.estensions import db
from app.models.academico import Programa
from app.utils.constantes import ESTADOS_USUARIO, ESTUDIANTE, ROLES
from app.utils.fechas import ahora


class Usuario(db.Model):
    __tablename__ = "usuario"
    __table_args__ = (Index("ix_usuario_estado_rol", "estado", "rol"),)

    id: Mapped[int] = mapped_column("id_usuario", primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150))
    correo: Mapped[str] = mapped_column(String(190), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    rol: Mapped[str] = mapped_column(Enum(*ROLES, name="rol_usuario"), default=ESTUDIANTE)
    estado: Mapped[str] = mapped_column(Enum(*ESTADOS_USUARIO, name="estado_usuario"), default="pendiente")
    id_programa: Mapped[int | None] = mapped_column(ForeignKey("programa.id_programa"))
    justificacion: Mapped[str | None] = mapped_column(Text)
    telefono: Mapped[str | None] = mapped_column(String(30))
    biografia: Mapped[str | None] = mapped_column(Text)
    lineas_investigacion: Mapped[str | None] = mapped_column(String(255))
    orcid: Mapped[str | None] = mapped_column(String(25))
    creado_en: Mapped[datetime] = mapped_column("fecha_creacion", default=ahora)

    programa: Mapped[Programa | None] = relationship(lazy="joined")
