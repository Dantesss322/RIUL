"""Modelo Postulacion (tabla `postulacion`)."""
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.models.usuario import Usuario
from app.models.convocatoria import Convocatoria
from app.utils.constantes import ESTADOS_POSTULACION
from app.utils.fechas import ahora


class Postulacion(db.Model):
    __tablename__ = "postulacion"
    __table_args__ = (
        UniqueConstraint("id_convocatoria", "id_usuario", name="uq_postulacion"),
        Index("ix_postulacion_estado", "estado"),
    )

    id: Mapped[int] = mapped_column("id_postulacion", primary_key=True)
    id_convocatoria: Mapped[int] = mapped_column(ForeignKey("convocatoria.id_convocatoria", ondelete="CASCADE"))
    id_usuario: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario", ondelete="CASCADE"))
    estado: Mapped[str] = mapped_column(Enum(*ESTADOS_POSTULACION, name="estado_postulacion"), default="pendiente")
    fecha: Mapped[datetime] = mapped_column(default=ahora)

    convocatoria: Mapped[Convocatoria] = relationship(lazy="joined")
    usuario: Mapped[Usuario] = relationship(lazy="joined")
