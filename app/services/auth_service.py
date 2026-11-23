"""Autenticacion y registro (RF-1.1 a RF-1.3).

La solicitud de registro crea un usuario `pendiente`; un administrador la aprueba o la rechaza.
"""
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash, generate_password_hash

from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.base import vista
from app.schemas.usuario import UsuarioSchema
from app.services.notificacion_service import notificar
from app.utils.constantes import ADMINISTRADOR, DOMINIO_INSTITUCIONAL
from app.utils.db import transaccional
from app.utils.errors import Conflicto, DatosInvalidos, NoAutenticado, Prohibido

CUENTA_PENDIENTE = "Tu cuenta aún no ha sido activada. Un administrador debe aprobar tu solicitud antes de que puedas ingresar."
CUENTA_RECHAZADA = "Tu solicitud de registro fue rechazada. Comunícate con la coordinación de investigación."


def iniciar_sesion(correo, password):
    usuario = UsuarioRepository.por_correo(correo.lower())
    if usuario is None or not check_password_hash(usuario.password_hash, password):
        raise NoAutenticado("El correo o la contraseña no son correctos.")
    if usuario.estado == "pendiente":
        raise Prohibido(CUENTA_PENDIENTE)
    if usuario.estado == "rechazado":
        raise Prohibido(CUENTA_RECHAZADA)

    return {
        "accessToken": create_access_token(identity=str(usuario.id)),
        "user": UsuarioSchema().dump(usuario),
    }


@transaccional
def registrar(datos):
    correo = datos["correo"].lower()
    justificacion = datos.get("justificacion")
    if not correo.endswith(DOMINIO_INSTITUCIONAL) and not justificacion:
        raise DatosInvalidos("Sin cuenta institucional debes explicar el motivo de tu solicitud.")
    if UsuarioRepository.por_correo(correo):
        raise Conflicto("Ya existe una solicitud o cuenta con ese correo.")

    usuario = UsuarioRepository.crear(
        nombre=datos["nombre"],
        correo=correo,
        password_hash=generate_password_hash(datos["password"]),
        id_programa=datos["id_programa"],
        justificacion=justificacion,
    )
    notificar(
        UsuarioRepository.ids_aprobados(rol=ADMINISTRADOR),
        "cuenta",
        f"{usuario.nombre} solicitó acceso a la plataforma.",
        "/app/admin/usuarios",
    )
    return {"id": usuario.id, "estado": usuario.estado}


def perfil(usuario):
    return vista(UsuarioSchema(), usuario)
