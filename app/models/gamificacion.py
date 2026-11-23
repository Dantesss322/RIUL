"""Gamificacion (RF-4): tipos de logro, niveles, logros e insignias.

XP y nivel no se guardan en usuario ni semillero: se derivan de los logros aprobados
y de la tabla `nivel` (una sola fuente de verdad).
"""
from datetime import datetime

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.estensions import db
from app.models.proyecto import Proyecto
from app.models.semillero import Semillero
from app.models.usuario import Usuario
from app.utils.constantes import AMBITOS_INSIGNIA, ESTADOS_LOGRO
from app.utils.fechas import ahora


class TipoLogro(db.Model):
    __tablename__ = "tipo_logro"
    __table_args__ = (CheckConstraint("xp > 0", name="ck_tipo_logro_xp"),)

    id: Mapped[int] = mapped_column("id_tipo_logro", primary_key=True)
    nombre: Mapped[str] = mapped_column(String(60), unique=True)
    xp: Mapped[int]


class Nivel(db.Model):
    """Umbral de XP de cada nivel (1 a 5 estrellas). La clave primaria es el propio nivel."""

    __tablename__ = "nivel"
    __table_args__ = (CheckConstraint("nivel BETWEEN 1 AND 5", name="ck_nivel_rango"),)

    nivel: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    xp_minimo: Mapped[int] = mapped_column(unique=True)


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


class UsuarioInsignia(db.Model):
    __tablename__ = "usuario_insignia"

    id_usuario: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario", ondelete="CASCADE"), primary_key=True)
    id_insignia: Mapped[int] = mapped_column(ForeignKey("insignia.id_insignia"), primary_key=True)
    fecha_obtenida: Mapped[datetime] = mapped_column(default=ahora)


class SemilleroInsignia(db.Model):
    __tablename__ = "semillero_insignia"

    id_semillero: Mapped[int] = mapped_column(ForeignKey("semillero.id_semillero", ondelete="CASCADE"), primary_key=True)
    id_insignia: Mapped[int] = mapped_column(ForeignKey("insignia.id_insignia"), primary_key=True)
    fecha_obtenida: Mapped[datetime] = mapped_column(default=ahora)
