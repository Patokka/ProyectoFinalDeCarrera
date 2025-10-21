# ---- Etapa 1: Imagen Base de Python ----
# Usamos una imagen oficial de Python.
FROM python:3.11-bookworm

# ---- Etapa 2: Parche de Seguridad ----
# Buena práctica: Actualizamos los paquetes del SO para mitigar vulnerabilidades.
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

# ---- Etapa 3: Configuración del Entorno ----
# Establecemos el directorio de trabajo dentro del contenedor.
WORKDIR /app

# ---- Etapa 4: Instalación de Dependencias ----
# Copiamos primero el archivo de requerimientos para aprovechar el caché de Docker.
COPY requirements.txt ./
# Instalamos las dependencias de Python.
RUN pip install --no-cache-dir -r requirements.txt

# ---- Etapa 5: Copia del Código Fuente ----
# Copiamos todo el código de nuestro backend al contenedor.
COPY . .

# ---- Etapa 6: Exponer el Puerto ----
# Le decimos a Docker que el contenedor escuchará en el puerto 8080.
EXPOSE 8080

# ---- Etapa 7: Comando de Ejecución ----
# El comando para iniciar el servidor FastAPI.
# Uvicorn correrá la instancia 'app' que está en el archivo 'main.py'.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]