"""Modelo Logro (tabla `logro`)."""
from datetime import datetime

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.models.usuario import Usuario
from app.models.semillero import Semillero
from app.models.proyecto import Proyecto
from app.models.tipo_logro import TipoLogro
from app.utils.constantes import ESTADOS_LOGRO
from app.utils.fechas import ahora


class Logro(db.Model):
    """Flujo: registrado -> en_validacion (lo envia el lider) -> aprobado | rechazado.

    Un producto de investigacion (articulo, ponencia, patente) es un logro con `id_proyecto`.
    """

    __tablename__ = "logro"
    __table_args__ = (
        CheckConstraint("estado = 'aprobado' OR xp_asignado = 0", name="ck_logro_xp"),
        Index("ix_logro_semillero_estado", "id_semillero", "estado"),
        Index("ix_logro_usuario_estado", "id_usuario", "estado"),
        Index("ix_logro_estado_fecha", "estado", "fecha_registro"),
    )

    id: Mapped[int] = mapped_column("id_logro", primary_key=True)
    id_usuario: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario"))
    id_semillero: Mapped[int] = mapped_column(ForeignKey("semillero.id_semillero"))
    id_tipo_logro: Mapped[int] = mapped_column(ForeignKey("tipo_logro.id_tipo_logro"))
    id_proyecto: Mapped[int | None] = mapped_column(ForeignKey("proyecto.id_proyecto"))
    titulo: Mapped[str] = mapped_column(String(190))
    descripcion: Mapped[str | None] = mapped_column(Text)
    evidencia_url: Mapped[str] = mapped_column(String(255))
    estado: Mapped[str] = mapped_column(Enum(*ESTADOS_LOGRO, name="estado_logro"), default="registrado")
    xp_asignado: Mapped[int] = mapped_column(default=0)
    id_validador: Mapped[int | None] = mapped_column(ForeignKey("usuario.id_usuario"))
    motivo_rechazo: Mapped[str | None] = mapped_column(Text)
    fecha_registro: Mapped[datetime] = mapped_column(default=ahora)
    fecha_validacion: Mapped[datetime | None]

    usuario: Mapped[Usuario] = relationship(foreign_keys=[id_usuario], lazy="joined")
    semillero: Mapped[Semillero] = relationship(lazy="joined")
    tipo_logro: Mapped[TipoLogro] = relationship(lazy="joined")
    proyecto: Mapped[Proyecto | None] = relationship(lazy="joined")
