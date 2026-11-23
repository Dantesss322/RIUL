"""Modelo Insignia (tabla `insignia`)."""
from sqlalchemy import CheckConstraint, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.extensions import db
from app.utils.constantes import AMBITOS_INSIGNIA


class Insignia(db.Model):
    """Regla generica: `cantidad_requerida` logros aprobados del tipo X (tipo nulo = cualquiera)."""

    __tablename__ = "insignia"
    __table_args__ = (CheckConstraint("cantidad_requerida > 0", name="ck_insignia_cantidad"),)

    id: Mapped[int] = mapped_column("id_insignia", primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80), unique=True)
    descripcion: Mapped[str] = mapped_column(String(255))
    ambito: Mapped[str] = mapped_column(Enum(*AMBITOS_INSIGNIA, name="ambito_insignia"))
    id_tipo_logro: Mapped[int | None] = mapped_column(ForeignKey("tipo_logro.id_tipo_logro"))
    cantidad_requerida: Mapped[int]
    icono: Mapped[str] = mapped_column(String(30))
