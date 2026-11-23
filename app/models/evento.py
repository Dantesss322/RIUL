"""Eventos y convocatorias institucionales (RF-5): los crea el administrador."""
from datetime import datetime

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Index, String, Text, UniqueConstraint, func, select
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from app.estensions import db
from app.models.usuario import Usuario
from app.utils.constantes import ESTADOS_POSTULACION, MODALIDADES
from app.utils.fechas import ahora


class Evento(db.Model):
    __tablename__ = "evento"
    __table_args__ = (CheckConstraint("cupos > 0", name="ck_evento_cupos"), Index("ix_evento_fecha", "fecha"))

    id: Mapped[int] = mapped_column("id_evento", primary_key=True)
    nombre: Mapped[str] = mapped_column(String(190))
    descripcion: Mapped[str] = mapped_column(Text)
    fecha: Mapped[datetime]
    lugar: Mapped[str] = mapped_column(String(190))
    modalidad: Mapped[str] = mapped_column(Enum(*MODALIDADES, name="modalidad_evento"))
    cupos: Mapped[int]
    id_creador: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario"))


class EventoParticipante(db.Model):
    __tablename__ = "evento_participante"

    id_evento: Mapped[int] = mapped_column(ForeignKey("evento.id_evento", ondelete="CASCADE"), primary_key=True)
    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="CASCADE"), primary_key=True, index=True
    )
    fecha_registro: Mapped[datetime] = mapped_column(default=ahora)


class Convocatoria(db.Model):
    __tablename__ = "convocatoria"
    __table_args__ = (Index("ix_convocatoria_limite", "fecha_limite"),)

    id: Mapped[int] = mapped_column("id_convocatoria", primary_key=True)
    titulo: Mapped[str] = mapped_column(String(190))
    descripcion: Mapped[str] = mapped_column(Text)
    fecha_limite: Mapped[datetime]
    id_creador: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario"))


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


# Inscritos de cada evento: se calcula en la consulta, no se almacena.
Evento.inscritos = column_property(
    select(func.count(EventoParticipante.id_usuario))
    .where(EventoParticipante.id_evento == Evento.id)
    .correlate_except(EventoParticipante)
    .scalar_subquery()
)
