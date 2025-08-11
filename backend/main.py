from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend.routers import ArrendadorController, ArrendamientoController, ArrendatarioController, FacturacionController, LocalidadController, PagoController, ParticipacionArrendadorController, PrecioController, ProvinciaController, RetencionController, UsuarioController

# Importar la configuración de base de datos
from .util.database import create_tables

# Importar todos los modelos para que SQLAlchemy los reconozca
from .model.Usuario import Usuario
from .model.Provincia import Provincia
from .model.Localidad import Localidad
from .model.Arrendador import Arrendador
from .model.Arrendatario import Arrendatario
from .model.Arrendamiento import Arrendamiento
from .model.Pago import Pago
from .model.Precio import Precio
from .model.Facturacion import Facturacion
from .model.Retencion import Retencion
from .model.ParticipacionArrendador import ParticipacionArrendador
from .model.pago_precio_association import pago_precio_association

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
    allow_origins=["*"],  #CAMBIAR PERMISOS DE QUIEN PUEDE ACCEDER EN PRODUCCION
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ruta de prueba
@app.get("/")
async def root():
    """Endpoint de prueba"""
    return {"message": "¡API de Arrendamientos funcionando! 🚀"}


# Registro de las diferentes rutas
app.include_router(ArrendadorController.router, prefix="/arrendadores", tags=["Arrendadores"])
app.include_router(ArrendatarioController.router, prefix="/arrendatarios", tags=["Arrendatarios"])
app.include_router(ArrendamientoController.router, prefix="/arrendamientos", tags=["Arrendamientos"])
app.include_router(PagoController.router, prefix="/pagos", tags=["Pagos"])
app.include_router(UsuarioController.router, prefix="/usuarios", tags=["Usuarios"])
app.include_router(FacturacionController.router, prefix="/facturacion", tags=["Facturacion"])
app.include_router(RetencionController.router, prefix="/retencion", tags=["Retencion"])
app.include_router(LocalidadController.router, prefix="/localidad", tags=["Localidad"])
app.include_router(ProvinciaController.router, prefix="/provincia", tags=["Provincia"])
app.include_router(PrecioController.router, prefix="/precio", tags=["Precio"])
app.include_router(ParticipacionArrendadorController.router, prefix="/participaciones", tags=["Participacioines de Arrendadores en Arrendamientos"])

