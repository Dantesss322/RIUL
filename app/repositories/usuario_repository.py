"""Consultas de usuarios."""
from sqlalchemy import select

from app.estensions import db
from app.models import Programa, Usuario
from app.repositories.base import BaseRepository
from app.utils.constantes import ADMINISTRADOR, ESTUDIANTE


class UsuarioRepository(BaseRepository):
    modelo = Usuario

    @staticmethod
    def por_correo(correo):
        return db.session.scalar(select(Usuario).where(Usuario.correo == correo))

    @staticmethod
    def por_ids(ids):
        """{id: usuario} de los ids indicados."""
        return {u.id: u for u in db.session.scalars(select(Usuario).where(Usuario.id.in_(ids)))}

    @staticmethod
    def buscar(estado=None, rol=None, texto=""):
        consulta = select(Usuario).order_by(Usuario.id)
        if estado:
            consulta = consulta.where(Usuario.estado == estado)
        if rol:
            consulta = consulta.where(Usuario.rol == rol)
        if texto:
            patron = f"%{texto.lower()}%"
            consulta = consulta.where((Usuario.nombre.ilike(patron)) | (Usuario.correo.ilike(patron)))
        return db.session.scalars(consulta).all()

    @staticmethod
    def estudiantes_aprobados():
        return db.session.scalars(
            select(Usuario).where(Usuario.rol == ESTUDIANTE, Usuario.estado == "aprobado").order_by(Usuario.id)
        ).all()

    @staticmethod
    def ids_aprobados(rol=None, sin_rol=None):
        """Ids de cuentas aprobadas, con un rol dado o sin cierto rol (destinatarios de notificaciones)."""
        consulta = select(Usuario.id).where(Usuario.estado == "aprobado")
        if rol:
            consulta = consulta.where(Usuario.rol == rol)
        if sin_rol:
            consulta = consulta.where(Usuario.rol != sin_rol)
        return db.session.scalars(consulta).all()

    @staticmethod
    def estudiantes_por_facultad():
        """[(id_facultad, id_usuario)] de los estudiantes aprobados con programa."""
        return db.session.execute(
            select(Programa.id_facultad, Usuario.id)
            .join(Programa, Usuario.id_programa == Programa.id)
            .where(Usuario.rol == ESTUDIANTE, Usuario.estado == "aprobado")
        ).all()

    @staticmethod
    def ids_aprobados_no_admin():
        return UsuarioRepository.ids_aprobados(sin_rol=ADMINISTRADOR)
