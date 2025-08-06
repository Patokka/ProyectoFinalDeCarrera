import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
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

# Función para crear las tablas
def create_tables():
    Base.metadata.create_all(bind=engine)
