"""Datos base que el sistema necesita para funcionar (equivalente a sql/02_datos_base.sql).

Se ejecuta al arrancar y es idempotente: cada bloque se inserta solo si su tabla esta vacia, de modo
que reiniciar la aplicacion nunca duplica ni pisa lo que la administracion ya configuro.
"""
from sqlalchemy import select
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import Facultad, Insignia, Nivel, Programa, TipoLogro, Usuario
from app.utils.constantes import ADMINISTRADOR

# XP que otorga cada tipo de logro (editable luego desde el panel de administracion)
TIPOS_LOGRO = (("Evento", 20), ("Publicación", 30), ("Proyecto", 50), ("Ponencia", 80), ("Artículo", 120), ("Patente", 200))

# Umbral de XP de cada nivel (estrellas)
NIVELES = ((1, 0), (2, 100), (3, 300), (4, 700), (5, 1500))

# (nombre, descripcion, ambito, tipo de logro o None = cualquiera, cantidad requerida, icono)
INSIGNIAS = (
    ("Primer paso", "Obtén tu primer logro aprobado.", "usuario", None, 1, "medalla"),
    ("Divulgador", "Presenta 3 ponencias aprobadas.", "usuario", "Ponencia", 3, "trofeo"),
    ("Autor", "Publica un artículo aprobado.", "usuario", "Artículo", 1, "libro"),
    ("Participante activo", "Participa en 5 eventos académicos.", "usuario", "Evento", 5, "calendario"),
    ("Constante", "Acumula 10 logros aprobados.", "usuario", None, 10, "trofeo"),
    ("Semillero en marcha", "El semillero acumula 3 logros aprobados.", "semillero", None, 3, "equipo"),
    ("Referente académico", "El semillero acumula 3 artículos aprobados.", "semillero", "Artículo", 3, "libro"),
    ("Innovador", "El semillero obtiene una patente.", "semillero", "Patente", 1, "idea"),
    ("Comunidad activa", "El semillero participa en 10 eventos.", "semillero", "Evento", 10, "calendario"),
)

# Estructura academica de ejemplo (se administra luego desde la plataforma)
ESTRUCTURA_ACADEMICA = {
    "Ingeniería": ("Ingeniería de Sistemas", "Ingeniería Industrial", "Ingeniería Ambiental"),
    "Derecho, Ciencias Políticas y Sociales": ("Derecho",),
    "Ciencias de la Salud": ("Medicina", "Enfermería"),
    "Ciencias Económicas, Administrativas y Contables": ("Contaduría Pública", "Administración de Empresas"),
}


def _vacia(modelo):
    return db.session.scalar(select(modelo).limit(1)) is None


def sembrar_datos_base(config):
    """Inserta lo que falte: reglas de gamificacion, estructura academica y el administrador inicial."""
    if _vacia(TipoLogro):
        db.session.add_all(TipoLogro(nombre=nombre, xp=xp) for nombre, xp in TIPOS_LOGRO)
        db.session.flush()

    if _vacia(Nivel):
        db.session.add_all(Nivel(nivel=nivel, xp_minimo=xp) for nivel, xp in NIVELES)

    if _vacia(Insignia):
        tipos = {t.nombre: t.id for t in db.session.scalars(select(TipoLogro))}
        db.session.add_all(
            Insignia(
                nombre=nombre,
                descripcion=descripcion,
                ambito=ambito,
                id_tipo_logro=tipos[tipo] if tipo else None,
                cantidad_requerida=cantidad,
                icono=icono,
            )
            for nombre, descripcion, ambito, tipo, cantidad, icono in INSIGNIAS
        )

    if _vacia(Facultad):
        for nombre, programas in ESTRUCTURA_ACADEMICA.items():
            facultad = Facultad(nombre=nombre)
            db.session.add(facultad)
            db.session.flush()
            db.session.add_all(Programa(nombre=programa, id_facultad=facultad.id) for programa in programas)

    if not db.session.scalar(select(Usuario).where(Usuario.correo == config["ADMIN_CORREO"])):
        db.session.add(
            Usuario(
                nombre=config["ADMIN_NOMBRE"],
                correo=config["ADMIN_CORREO"],
                password_hash=generate_password_hash(config["ADMIN_PASSWORD"]),
                rol=ADMINISTRADOR,
                estado="aprobado",
            )
        )

    db.session.commit()
