from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend.dtos.UsuarioDto import UsuarioLogin
from backend.routers import ArrendadorController, ArrendamientoController, ArrendatarioController, FacturacionController, LocalidadController, PagoController, ParticipacionArrendadorController, PrecioController, ProvinciaController, ReporteController, RetencionController, UsuarioController
from backend.services.PagoService import PagoService
from backend.util.jwtYPasswordHandler import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, verify_password
from backend.util.permisosUser import get_current_user
from backend.dtos.JobUpdateRequest import JobUpdateRequest 

# Importar la configuración de base de datos
from .util.database import create_tables, get_db

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
from .util.Configuracion import Configuracion
from .util.jobConfiguration import jobConfiguration

# Importación de elementos necesarios para consultar los precios automaticamente a las 08:00 y 17:00 todos los días
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
import pytz
from backend.services.PrecioService import PrecioService
from backend.services.ReporteService import ReporteService
from backend.util.database import SessionLocal  

#Para sacar un poco de logs que son ruidosos y mas que nada son sentencias de la base de datos
import logging
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


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

#Definición de jobs asincrónicos
def obtener_funcion_por_id(job_id):
    funciones = {
        "precio_diario_bcr": job_actualizar_precio,
        "enviar_reportes_pagos_pendientes_mes": job_enviar_reporte_pagos,
        "actualizar_precios_pagos_mensuales": job_actualizar_precios_pagos,
        "actualizar_precios_pagos10a15": job_actualizar_precios_pagos_10a15,
    }
    return funciones.get(job_id)

#Inicializar los jobs cuando se arranca la aplicación
def inicializar_jobs_desde_db():
    db = SessionLocal()
    configs = db.query(jobConfiguration).filter_by(active=True).all()
    for config in configs:
        trigger = CronTrigger(
            day=config.day,
            hour=config.hour,
            minute=config.minute
        )
        scheduler.add_job(
            func=obtener_funcion_por_id(config.job_id),
            trigger=trigger,
            id=config.job_id
        )
        print(f"job arrancado: {config.job_id}")

#Definición de jobs particulares y delegación a servicios correspondientes
def job_actualizar_precio():
    db = SessionLocal()
    try:
        print(f"[{datetime.now()}] Ejecutando job de actualización de precio BCR.")
        PrecioService.actualizar_precio_bcr(db)
    except Exception as e:
        print(f"Error en job BCR: {e}")
    finally:
        db.close()
        
def job_enviar_reporte_pagos():
    db = SessionLocal()
    try: 
        print(f"[{datetime.now()}] Ejecutando job de envío de reporte mensual de pagos pendientes.")
        ReporteService.enviar_reportes_pagos(db)
    except Exception as e:
        print(f"Error en el envío: {e}")
    finally:
        db.close()

def job_actualizar_precios_pagos():
    db = SessionLocal()
    try: 
        print(f"[{datetime.now()}] Ejecutando job de actualización de precios mensual de pagos pendientes.")
        PagoService.generarPreciosCuotasMensual(db)
    except Exception as e:
        print(f"Error en el envío: {e}")
    finally:
        db.close()
        
def job_actualizar_precios_pagos_10a15():
    db = SessionLocal()
    try: 
        print(f"[{datetime.now()}] Ejecutando job de actualización de pagos pendientes cuyo precio se calcula los dias 16 y se toman los 5 dias anteriores.")
        PagoService.generarPrecioCuotas10a15(db)
    except Exception as e:
        print(f"Error en el envío: {e}")
    finally:
        db.close()
        
        
# Zona horaria de Argentina
argentina_tz = pytz.timezone("America/Argentina/Buenos_Aires")

# Scheduler
scheduler = BackgroundScheduler(timezone=argentina_tz)

# Crear jobs desde la base
inicializar_jobs_desde_db()
scheduler.start()



#Ruta de login para usuarios
@app.post("/login", response_model = dict, description=" 20443072684,clave123")
def login(dto: UsuarioLogin, db: Session = Depends(get_db)):
    
    usuario = db.query(Usuario).filter(Usuario.cuil == dto.cuil).first()
    
    if not usuario or not verify_password(dto.contrasena, usuario.contrasena):
        raise HTTPException(status_code=401, detail="Cuil o clave inválidas.")
    
    #Duración del token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    #Creación del token
    access_token = create_access_token(data={"cuil": usuario.cuil, "nombre": usuario.nombre, "apellido": usuario.apellido, "rol": usuario.rol.name }, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

#Ruta para poder modificar la frecuencia con la que se realizan los diferentes trabajos
@app.post("/actualizar-job")
def actualizar_job(data: JobUpdateRequest, db: Session = Depends(get_db)):
    job_config = db.query(jobConfiguration).filter_by(job_id = data.job_id).first()
    if not job_config:
        raise HTTPException(status_code=404, detail="Job no encontrado")

    job_config.day = data.day
    job_config.hour = data.hour
    job_config.minute = data.minute
    job_config.active = data.active
    db.commit()

    scheduler.remove_job(data.job_id)
    if data.active:
        trigger = CronTrigger(day=data.day, hour=data.hour, minute=data.minute)
        scheduler.add_job(
            func=obtener_funcion_por_id(data.job_id),
            trigger=trigger,
            id=data.job_id
        )

    return {"mensaje": f"Job '{data.job_id}' actualizado y en funcionamiento."}


# Registro de las diferentes rutas
app.include_router(ReporteController.router, prefix="/reportes", tags=["Reportes"], dependencies=[Depends(get_current_user)])
app.include_router(ArrendadorController.router, prefix="/arrendadores", tags=["Arrendadores"], dependencies=[Depends(get_current_user)])
app.include_router(ArrendatarioController.router, prefix="/arrendatarios", tags=["Arrendatarios"], dependencies=[Depends(get_current_user)])
app.include_router(ArrendamientoController.router, prefix="/arrendamientos", tags=["Arrendamientos"], dependencies=[Depends(get_current_user)])
app.include_router(PagoController.router, prefix="/pagos", tags=["Pagos"], dependencies=[Depends(get_current_user)])
app.include_router(UsuarioController.router, prefix="/usuarios", tags=["Usuarios"], dependencies=[Depends(get_current_user)])
app.include_router(FacturacionController.router, prefix="/facturacion", tags=["Facturacion"], dependencies=[Depends(get_current_user)])
app.include_router(RetencionController.router, prefix="/retencion", tags=["Retencion"], dependencies=[Depends(get_current_user)])
app.include_router(LocalidadController.router, prefix="/localidad", tags=["Localidad"], dependencies=[Depends(get_current_user)])
app.include_router(ProvinciaController.router, prefix="/provincia", tags=["Provincia"], dependencies=[Depends(get_current_user)])
app.include_router(PrecioController.router, prefix="/precio", tags=["Precio"], dependencies=[Depends(get_current_user)]) #SI ENCONTRAS FORMA DE HACER QUE LLEGUE LA DE AGD PONER INDIVIDUALMENTE LOS LOCKS EN ESTAS RUTAS
app.include_router(ParticipacionArrendadorController.router, prefix="/participaciones", tags=["Participacioines de Arrendadores en Arrendamientos"], dependencies=[Depends(get_current_user)])

