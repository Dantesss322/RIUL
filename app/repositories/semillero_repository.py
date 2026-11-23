"""Consultas de semilleros, integrantes, vinculaciones y seguimiento."""
from sqlalchemy import select

from app.estensions import db
from app.models import Facultad, SeguimientoSemillero, Semillero, SemilleroIntegrante
from app.repositories.base import BaseRepository
from app.utils.constantes import ADMINISTRADOR, DOCENTE_LIDER


class SemilleroRepository(BaseRepository):
    modelo = Semillero

    @staticmethod
    def buscar(texto="", ids=None):
        """Semilleros cuyo nombre o facultad contienen el texto; `ids` limita a un conjunto (None = todos)."""
        consulta = select(Semillero).join(Facultad, Semillero.id_facultad == Facultad.id).order_by(Semillero.id)
        if ids is not None:
            consulta = consulta.where(Semillero.id.in_(ids))
        if texto:
            patron = f"%{texto.lower()}%"
            consulta = consulta.where(Semillero.nombre.ilike(patron) | Facultad.nombre.ilike(patron))
        return db.session.scalars(consulta).all()

    @staticmethod
    def ids_de(usuario):
        """Semilleros con los que el usuario tiene vinculo: todos (administrador), los que lidera o aquellos
        donde es integrante activo."""
        if usuario.rol == ADMINISTRADOR:
            consulta = select(Semillero.id).order_by(Semillero.id)
        elif usuario.rol == DOCENTE_LIDER:
            consulta = select(Semillero.id).where(Semillero.id_docente_lider == usuario.id).order_by(Semillero.id)
        else:
            consulta = (
                select(SemilleroIntegrante.id_semillero)
                .where(SemilleroIntegrante.id_usuario == usuario.id, SemilleroIntegrante.estado == "activo")
                .order_by(SemilleroIntegrante.id)
            )
        return db.session.scalars(consulta).all()

    @staticmethod
    def lidera(id_usuario):
        """True si el usuario es docente lider de al menos un semillero."""
        return db.session.scalar(select(Semillero.id).where(Semillero.id_docente_lider == id_usuario).limit(1)) is not None

    # --- Seguimiento -----------------------------------------------------------------------

    @staticmethod
    def seguidos_por(id_usuario):
        return set(db.session.scalars(select(SeguimientoSemillero.id_semillero).where(SeguimientoSemillero.id_usuario == id_usuario)))

    @staticmethod
    def seguir(id_usuario, id_semillero):
        if db.session.get(SeguimientoSemillero, (id_usuario, id_semillero)) is None:
            db.session.add(SeguimientoSemillero(id_usuario=id_usuario, id_semillero=id_semillero))
            db.session.flush()

    @staticmethod
    def dejar_de_seguir(id_usuario, id_semillero):
        seguimiento = db.session.get(SeguimientoSemillero, (id_usuario, id_semillero))
        if seguimiento:
            db.session.delete(seguimiento)
            db.session.flush()

    @staticmethod
    def contar_seguidores(id_semillero):
        return len(db.session.scalars(select(SeguimientoSemillero.id_usuario).where(SeguimientoSemillero.id_semillero == id_semillero)).all())

    @staticmethod
    def audiencia(semillero):
        """Lider, integrantes activos y seguidores: a quienes se avisan las novedades del semillero."""
        integrantes = db.session.scalars(
            select(SemilleroIntegrante.id_usuario).where(
                SemilleroIntegrante.id_semillero == semillero.id, SemilleroIntegrante.estado == "activo"
            )
        )
        seguidores = db.session.scalars(select(SeguimientoSemillero.id_usuario).where(SeguimientoSemillero.id_semillero == semillero.id))
        return {semillero.id_docente_lider, *integrantes, *seguidores}


class IntegranteRepository(BaseRepository):
    modelo = SemilleroIntegrante

    @staticmethod
    def de_semillero(id_semillero, estado):
        return db.session.scalars(
            select(SemilleroIntegrante)
            .where(SemilleroIntegrante.id_semillero == id_semillero, SemilleroIntegrante.estado == estado)
            .order_by(SemilleroIntegrante.id)
        ).all()

    @staticmethod
    def vinculo(id_semillero, id_usuario):
        return db.session.scalar(
            select(SemilleroIntegrante).where(
                SemilleroIntegrante.id_semillero == id_semillero, SemilleroIntegrante.id_usuario == id_usuario
            )
        )

    @staticmethod
    def es_activo(id_semillero, id_usuario):
        vinculo = IntegranteRepository.vinculo(id_semillero, id_usuario)
        return vinculo is not None and vinculo.estado == "activo"

    @staticmethod
    def vinculos_de(id_usuario):
        """{id_semillero: integrante} de todos los vinculos (cualquier estado) de una persona."""
        filas = db.session.scalars(select(SemilleroIntegrante).where(SemilleroIntegrante.id_usuario == id_usuario)).all()
        return {fila.id_semillero: fila for fila in filas}

    @staticmethod
    def buscar(estado=None, id_usuario=None, ids_semillero=None):
        """Vinculaciones filtradas por estado, por persona o por los semilleros de un lider."""
        consulta = select(SemilleroIntegrante).order_by(SemilleroIntegrante.id)
        if estado:
            consulta = consulta.where(SemilleroIntegrante.estado == estado)
        if id_usuario is not None:
            consulta = consulta.where(SemilleroIntegrante.id_usuario == id_usuario)
        if ids_semillero is not None:
            consulta = consulta.where(SemilleroIntegrante.id_semillero.in_(ids_semillero))
        return db.session.scalars(consulta).all()

    @staticmethod
    def activos_por_usuario():
        """Conjunto de ids de usuarios con al menos un vinculo activo."""
        return set(db.session.scalars(select(SemilleroIntegrante.id_usuario).where(SemilleroIntegrante.estado == "activo")))
