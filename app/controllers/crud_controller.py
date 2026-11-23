"""Controlador CRUD generico: las cinco acciones estandar de un catalogo."""
from app.utils.auth import usuario_actual
from app.utils.request import validar
from app.utils.response import success


class ControladorCrud:
    def __init__(self, servicio, schema, registra_creador=False):
        """`registra_creador`: guarda al administrador que crea el registro en `id_creador` (eventos)."""
        self.servicio = servicio
        self.schema = schema
        self.registra_creador = registra_creador

    def listar(self):
        return success(self.servicio.listar())

    def obtener(self, id_):
        return success(self.servicio.obtener(id_))

    def crear(self):
        extra = {"id_creador": usuario_actual().id} if self.registra_creador else {}
        return success(self.servicio.crear(validar(self.schema()), **extra), "Registro creado correctamente.", 201)

    def actualizar(self, id_):
        datos = validar(self.schema(), parcial=True)
        return success(self.servicio.actualizar(id_, datos), "Cambios guardados correctamente.")

    def eliminar(self, id_):
        self.servicio.eliminar(id_)
        return success(None, "Registro eliminado correctamente.")
