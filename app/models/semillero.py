"""Semilleros, sus integrantes (y solicitudes de vinculacion) y el seguimiento de la comunidad."""
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Index, String, Text, UniqueConstraint, func, select
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from app.estensions import db
from app.models.academico import Facultad
from app.models.usuario import Usuario
from app.utils.constantes import ESTADOS_INTEGRANTE, ROLES_INTEGRANTE
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


class SemilleroIntegrante(db.Model):
    """Integrante de un semillero. Una solicitud de vinculacion es un integrante `pendiente`."""

    __tablename__ = "semillero_integrante"
    __table_args__ = (
        UniqueConstraint("id_semillero", "id_usuario", name="uq_integrante"),
        Index("ix_integrante_usuario", "id_usuario", "estado"),
    )

    id: Mapped[int] = mapped_column("id_integrante", primary_key=True)
    id_semillero: Mapped[int] = mapped_column(ForeignKey("semillero.id_semillero", ondelete="CASCADE"))
    id_usuario: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario", ondelete="CASCADE"))
    rol: Mapped[str] = mapped_column(Enum(*ROLES_INTEGRANTE, name="rol_integrante"), default="Joven investigador")
    estado: Mapped[str] = mapped_column(Enum(*ESTADOS_INTEGRANTE, name="estado_integrante"), default="pendiente")
    fecha_ingreso: Mapped[datetime] = mapped_column(default=ahora)

    semillero: Mapped[Semillero] = relationship(lazy="joined")
    usuario: Mapped[Usuario] = relationship(lazy="joined")


class SeguimientoSemillero(db.Model):
    __tablename__ = "seguimiento_semillero"

    id_usuario: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario", ondelete="CASCADE"), primary_key=True)
    id_semillero: Mapped[int] = mapped_column(
        ForeignKey("semillero.id_semillero", ondelete="CASCADE"), primary_key=True, index=True
    )
    fecha: Mapped[datetime] = mapped_column(default=ahora)


# Integrantes activos de cada semillero: se calcula en la consulta, no se almacena.
Semillero.total_integrantes = column_property(
    select(func.count(SemilleroIntegrante.id))
    .where(SemilleroIntegrante.id_semillero == Semillero.id, SemilleroIntegrante.estado == "activo")
    .correlate_except(SemilleroIntegrante)
    .scalar_subquery()
)
