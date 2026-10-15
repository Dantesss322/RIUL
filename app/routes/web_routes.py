"""Rutas de las paginas (HTML).

Cada pagina es una plantilla de `app/templates`. La informacion que muestran
se carga desde JavaScript (app/static/js) llamando a la API.
"""
from flask import Blueprint, redirect, render_template, url_for

web_bp = Blueprint("web", __name__)

# (direccion, plantilla). Los parametros de la direccion llegan a la plantilla.
PAGINAS = [
    # Publicas
    ("/", "landing.html"),
    # Acceso
    ("/login", "login.html"),
    ("/registro", "registro.html"),
    # Aplicacion (requiere sesion)
    ("/app", "dashboard.html"),
    ("/app/perfil", "perfil.html"),
    ("/app/semilleros", "semilleros.html"),
    ("/app/semilleros/<int:item_id>", "semillero_detalle.html"),
    ("/app/proyectos", "proyectos.html"),
    ("/app/proyectos/<int:item_id>", "proyecto_detalle.html"),
    ("/app/publicaciones", "publicaciones.html"),
    ("/app/publicaciones/nueva", "publicacion_nueva.html"),
    ("/app/eventos", "eventos.html"),
    ("/app/notificaciones", "notificaciones.html"),
    ("/app/logros", "logros.html"),
    ("/app/logros/nuevo", "logro_nuevo.html"),
    ("/app/ranking", "ranking.html"),
    ("/app/validaciones", "validaciones.html"),
    # Administracion
    ("/app/admin/usuarios", "admin_usuarios.html"),
    ("/app/admin/academica", "admin_academica.html"),
    ("/app/admin/semilleros", "admin_semilleros.html"),
    ("/app/admin/eventos", "admin_eventos.html"),
    ("/app/admin/gamificacion", "admin_gamificacion.html"),
    ("/app/indicadores", "indicadores.html"),
]


def _pagina(plantilla):
    """Crea la vista que renderiza una plantilla con los parametros de la URL."""

    def vista(**parametros):
        return render_template(plantilla, **parametros)

    return vista


for direccion, plantilla in PAGINAS:
    web_bp.add_url_rule(
        direccion,
        endpoint=plantilla.removesuffix(".html"),
        view_func=_pagina(plantilla),
    )


TIPOS_EXPLORAR = ("semilleros", "proyectos", "eventos")


@web_bp.route("/explorar/<tipo>")
def explorar(tipo):
    """Exploracion publica: un tipo desconocido vuelve al listado de semilleros."""
    if tipo not in TIPOS_EXPLORAR:
        return redirect(url_for("web.explorar", tipo="semilleros"))
    return render_template("explorar.html", tipo=tipo)


@web_bp.app_errorhandler(404)
def no_encontrada(_error):
    return render_template("404.html"), 404
