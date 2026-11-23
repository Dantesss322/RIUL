"""Fechas de RIUL: se guardan en UTC (sin zona) y se entregan al navegador en ISO 8601 con `Z`."""
from datetime import datetime, timedelta, timezone

DIA = timedelta(days=1)


def ahora():
    """Instante actual en UTC, sin microsegundos (MySQL DATETIME no los conserva)."""
    return datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)


def a_iso(fecha):
    """datetime UTC -> '2026-11-22T10:30:00Z'."""
    return fecha.isoformat() + "Z"


def dias_desde(fecha):
    """Dias completos transcurridos desde `fecha` (negativo si es futura)."""
    return (ahora() - fecha) // DIA
