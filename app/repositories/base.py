"""Repositorio base: operaciones CRUD comunes a todos los modelos.

Los repositorios solo consultan y modifican la sesion (`flush`); quien confirma o deshace la
transaccion es el servicio (ver `utils/db.py::transaccional`).
"""
from sqlalchemy import exists, func, inspect, select

from app.estensions import db


class BaseRepository:
    modelo = None

    @classmethod
    def listar(cls):
        return db.session.scalars(select(cls.modelo).order_by(*inspect(cls.modelo).primary_key)).all()

    @classmethod
    def obtener(cls, id_):
        return db.session.get(cls.modelo, id_)

    @classmethod
    def crear(cls, **datos):
        objeto = cls.modelo(**datos)
        db.session.add(objeto)
        db.session.flush()
        return objeto

    @classmethod
    def actualizar(cls, objeto, datos):
        for campo, valor in datos.items():
            setattr(objeto, campo, valor)
        db.session.flush()
        return objeto

    @classmethod
    def eliminar(cls, objeto):
        db.session.delete(objeto)
        db.session.flush()

    @classmethod
    def contar(cls, *criterios):
        return db.session.scalar(select(func.count()).select_from(cls.modelo).where(*criterios))


def existe_referencia(modelo, columna, valor):
    """True si alguna fila de `modelo` tiene `columna` igual a `valor` (para impedir borrados con dependientes)."""
    return db.session.scalar(select(exists().where(getattr(modelo, columna) == valor)))


def mapa(consulta):
    """Ejecuta una consulta de dos columnas (llave, valor) y la devuelve como diccionario."""
    return dict(db.session.execute(consulta).all())
