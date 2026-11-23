"""Modelo EventoParticipante (tabla `evento_participante`)."""
from datetime import datetime

from sqlalchemy import ForeignKey, func, select
from sqlalchemy.orm import Mapped, column_property, mapped_column

from app.extensions import db
from app.models.evento import Evento
from app.utils.fechas import ahora


class EventoParticipante(db.Model):
    __tablename__ = "evento_participante"

    id_evento: Mapped[int] = mapped_column(ForeignKey("evento.id_evento", ondelete="CASCADE"), primary_key=True)
    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="CASCADE"), primary_key=True, index=True
    )
    fecha_registro: Mapped[datetime] = mapped_column(default=ahora)


# Inscritos de cada evento: se calcula en la consulta, no se almacena.
Evento.inscritos = column_property(
    select(func.count(EventoParticipante.id_usuario))
    .where(EventoParticipante.id_evento == Evento.id)
    .correlate_except(EventoParticipante)
    .scalar_subquery()
)
