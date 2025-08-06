from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Importar la configuración de base de datos
from .util.database import get_db, create_tables

# Importar todos los modelos para que SQLAlchemy los reconozca
from .model.Usuario import Usuario
from .model.Provincia import Provincia
from .model.Localidad import Localidad
from .model.Arrendador import Arrendador
from .model.Arrendatario import Arrendatario
from .model.Arrendamiento import Arrendamiento
from .model.Pago import Pago
from .model.ConsultaPrecio import ConsultaPrecio
from .model.Precio import Precio
from .model.Facturacion import Facturacion
from .model.Retencion import Retencion
from .model.ParticipacionArrendador import ParticipacionArrendador

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestionar el ciclo de vida de la aplicación"""
    # Startup: crear las tablas
    print("🚀 Iniciando aplicación...")
    try:
        create_tables()
        print("✅ Tablas creadas exitosamente")
    except Exception as e:
        print(f"❌ Error al crear las tablas: {e}")
    
    yield
    
    # Shutdown: limpiar recursos si es necesario
    print("🔄 Cerrando aplicación...")

# Crear la aplicación FastAPI con lifespan
app = FastAPI(
    title="Sistema de Arrendamientos",
    description="API para gestión de arrendamientos rurales",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ruta de prueba
@app.get("/")
async def root():
    """Endpoint de prueba"""
    return {"message": "¡API de Arrendamientos funcionando! 🚀"}
