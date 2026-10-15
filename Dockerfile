# Imagen de base
FROM python:3.14.7

# Variables de entorno
# Evita que Python genere archivos .pyc
ENV PYTHONDONTWRITEBYTECODE=1

# Logs sin buffer (se ven al instante en `docker compose logs`)
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo
WORKDIR /app

# Dependencias del sistema
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc \
    && rm -rf /var/lib/apt/lists/*

# Dependencias de Python
COPY requirements.txt .

# Instalacion de las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Codigo de la aplicacion
COPY . .

# Puerto
EXPOSE 5000

# Gunicorn ejecuta la aplicacion Flask (objeto `app` de run.py)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "3", "run:app"]
