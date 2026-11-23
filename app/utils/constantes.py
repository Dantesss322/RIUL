"""Vocabulario cerrado del dominio RIUL.

Los valores coinciden con los ENUM de la base de datos y con `static/js/core/dominio.js`.
"""

ADMINISTRADOR = "administrador"
DOCENTE_LIDER = "docente_lider"
ESTUDIANTE = "estudiante"

ROLES = (ADMINISTRADOR, DOCENTE_LIDER, ESTUDIANTE)
ESTADOS_USUARIO = ("pendiente", "aprobado", "rechazado")

ROLES_INTEGRANTE = ("Coinvestigador", "Joven investigador", "Auxiliar de investigación")
ESTADOS_INTEGRANTE = ("pendiente", "activo", "rechazado")

ESTADOS_PROYECTO = ("activo", "en_pausa", "finalizado")

ESTADOS_LOGRO = ("registrado", "en_validacion", "aprobado", "rechazado")
AMBITOS_INSIGNIA = ("usuario", "semillero")

CATEGORIAS_PUBLICACION = ("Avance", "Evento", "Logro", "Divulgación", "Convocatoria")
ESTADOS_PUBLICACION = ("pendiente", "publicada", "rechazada")
TIPOS_INTERACCION = ("reaccion", "comentario", "compartido")

MODALIDADES = ("Presencial", "Virtual", "Híbrida")
ESTADOS_POSTULACION = ("pendiente", "aprobada", "rechazada")

DOMINIO_INSTITUCIONAL = "@unilibre.edu.co"

# Un semillero sin actividad (o un proyecto sin avances) durante este tiempo se considera inactivo.
DIAS_SIN_ACTIVIDAD = 90
