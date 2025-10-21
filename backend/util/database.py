import os
import time  # <-- NUEVO IMPORT
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.exc import OperationalError  # <-- NUEVO IMPORT
from dotenv import load_dotenv
from pathlib import Path

# Cargar el .env desde el directorio raíz del proyecto
env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)
# Configuración de la base de datos MySQL
DATABASE_URL = os.getenv("DATABASE_URL")

# Crear engine
engine = create_engine(DATABASE_URL, echo=True)

# Crear SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

# Función para obtener sesión de base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- FUNCIÓN MODIFICADA CON REINTENTOS ---
def create_tables():
    """
    Crea las tablas, pero reintenta 10 veces si la base de datos no está lista.
    """
    print("Intentando conectar a la base de datos para crear tablas...")
    intentos = 10
    
    for i in range(intentos):
        try:
            # 1. Intentamos la operación que falla (crear tablas)
            Base.metadata.create_all(bind=engine)
            
            # 2. Si tiene éxito, salimos del bucle
            print("¡Conexión exitosa! Tablas creadas/verificadas.")
            return  # <-- Salimos de la función
            
        except OperationalError as e:
            # 3. Si falla, es (probablemente) porque la BD no está lista
            print(f"Intento {i + 1}/{intentos}: La BD no está lista.")
            
            if i < intentos - 1:
                print("Reintentando en 5 segundos...")
                time.sleep(5) # Esperamos 5 segundos
            else:
                print("Error: No se pudo conectar a la base de datos después de varios intentos.")
                raise  # Lanza la última excepción para que el log la muestre