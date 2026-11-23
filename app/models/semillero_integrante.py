"""Modelo SemilleroIntegrante (tabla `semillero_integrante`)."""
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Index, UniqueConstraint, func, select
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from app.extensions import db
from app.models.usuario import Usuario
from app.models.semillero import Semillero
from app.utils.constantes import ESTADOS_INTEGRANTE, ROLES_INTEGRANTE
from app.utils.fechas import ahora


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


# Integrantes activos de cada semillero: se calcula en la consulta, no se almacena.
Semillero.total_integrantes = column_property(
    select(func.count(SemilleroIntegrante.id))
    .where(SemilleroIntegrante.id_semillero == Semillero.id, SemilleroIntegrante.estado == "activo")
    .correlate_except(SemilleroIntegrante)
    .scalar_subquery()
)
