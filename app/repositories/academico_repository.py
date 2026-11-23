"""Consultas de la estructura academica."""
from app.models import Facultad, Programa
from app.repositories.base import BaseRepository


class FacultadRepository(BaseRepository):
    modelo = Facultad


class ProgramaRepository(BaseRepository):
    modelo = Programa
