"""Prueba de humo: la aplicacion se crea con una base SQLite temporal y atiende lo basico de la API.

Ejecutar desde la raiz del proyecto:  python -m unittest discover tests
"""
import os
import tempfile
import unittest

# La configuracion se lee al importar `app`: se define antes de importarla.
CARPETA = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{CARPETA}/prueba.db"
os.environ["UPLOAD_FOLDER"] = f"{CARPETA}/uploads"

from app import create_app  # noqa: E402


class HumoTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_la_base_de_datos_es_la_de_la_prueba(self):
        self.assertIn("sqlite", self.app.config["SQLALCHEMY_DATABASE_URI"])

    def test_los_programas_son_publicos_y_vienen_sembrados(self):
        respuesta = self.client.get("/api/programas")
        self.assertEqual(respuesta.status_code, 200)
        self.assertTrue(respuesta.get_json()["success"])
        self.assertGreater(len(respuesta.get_json()["data"]), 0)

    def test_una_ruta_protegida_exige_sesion(self):
        respuesta = self.client.get("/api/semilleros")
        self.assertEqual(respuesta.status_code, 401)
        self.assertFalse(respuesta.get_json()["success"])

    def test_el_administrador_inicial_puede_ingresar(self):
        config = self.app.config
        respuesta = self.client.post(
            "/api/auth/login",
            json={"correo": config["ADMIN_CORREO"], "password": config["ADMIN_PASSWORD"]},
        )
        self.assertEqual(respuesta.status_code, 200)
        self.assertIn("accessToken", respuesta.get_json()["data"])


if __name__ == "__main__":
    unittest.main()
