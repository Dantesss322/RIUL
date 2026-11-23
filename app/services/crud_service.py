"""Servicio CRUD generico para los catalogos administrables (RF-7.1).

Un catalogo (facultades, programas, niveles, insignias, tipos de logro, eventos, convocatorias) se
declara con su repositorio, su schema y las tablas que impiden eliminarlo; no se repite codigo.
"""
from app.repositories.base import existe_referencia
from app.utils.db import transaccional
from app.utils.errors import Conflicto, NoEncontrado


class ServicioCrud:
    def __init__(self, repositorio, schema, dependientes=()):
        """`dependientes`: tuplas (modelo, columna, etiqueta) con lo que impide eliminar un registro."""
        self.repositorio = repositorio
        self.schema = schema
        self.dependientes = dependientes

    def _obtener(self, id_):
        objeto = self.repositorio.obtener(id_)
        if objeto is None:
            raise NoEncontrado()
        return objeto

    def listar(self):
        return self.schema(many=True).dump(self.repositorio.listar())

    def obtener(self, id_):
        return self.schema().dump(self._obtener(id_))

    @transaccional
    def crear(self, datos, **extra):
        return self.schema().dump(self.repositorio.crear(**datos, **extra))

    @transaccional
    def actualizar(self, id_, datos):
        return self.schema().dump(self.repositorio.actualizar(self._obtener(id_), datos))

    @transaccional
    def eliminar(self, id_):
        objeto = self._obtener(id_)
        for modelo, columna, etiqueta in self.dependientes:
            if existe_referencia(modelo, columna, id_):
                raise Conflicto(f"No se puede eliminar: tiene {etiqueta} asociados.")
        self.repositorio.eliminar(objeto)
