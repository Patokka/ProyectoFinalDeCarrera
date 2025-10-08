from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from dtos.ConfiguracionDto import ConfiguracionDtoModificacion
from util.database import get_db
from dtos.RetencionDto import RetencionDto, RetencionDtoOut, RetencionDtoModificacion
from services.RetencionService import RetencionService


router = APIRouter()

@router.get("/", response_model=list[RetencionDtoOut], description="Obtención de todas las retenciones.")
def listar_retenciones(db: Session = Depends(get_db)):
    return RetencionService.listar_todos(db)

@router.get("/{retencion_id}", response_model=RetencionDtoOut, description="Obtención de una retención por id.")
def obtener_retencion(retencion_id: int, db: Session = Depends(get_db)):
    return RetencionService.obtener_por_id(db, retencion_id)

@router.post("/", response_model=RetencionDtoOut, description="Creación de una retención.")
def crear_retencion(dto: RetencionDto, db: Session = Depends(get_db)):
    return RetencionService.crear(db, dto)

@router.put("/{retencion_id}", response_model=RetencionDtoOut, description="Actualización de una retención por id.")
def actualizar_retencion(retencion_id: int, dto: RetencionDtoModificacion, db: Session = Depends(get_db)):
    return RetencionService.actualizar(db, retencion_id, dto)

@router.delete("/{retencion_id}", description="Eliminación de una retención por id.")
def eliminar_retencion(retencion_id: int, db: Session = Depends(get_db)):
    RetencionService.eliminar(db, retencion_id)
    return {"mensaje": "Retención eliminada correctamente."}

@router.get("/arrendador/{arrendador_id}", response_model=list[RetencionDtoOut], description="Obtención de todas las retencinoes de un arrendador.")
def obtener_retenciones_arrendador(arrendador_id: int, db: Session = Depends(get_db)):
    return RetencionService.obtener_retenciones_arrendador(db, arrendador_id)

@router.get("/facturacion/{facturacion_id}", response_model=Optional[RetencionDtoOut], description="Obtención de retención de una facturación determinada.")
def listar_retenciones(facturacion_id: int,db: Session = Depends(get_db)):
    return RetencionService.obtener_por_factura_id(db, facturacion_id)

@router.post("/configuracion")
def actualizar_configuracion(config_update: ConfiguracionDtoModificacion, db: Session = Depends(get_db)):
    return RetencionService.actualizar_configuracion(db, config_update.clave, config_update.valor)

@router.get("/configuracion/destinatarios", response_model= list[str])
def obtener_destinatarios(db: Session = Depends(get_db)):
    return RetencionService.obtener_destinatarios(db)

@router.get("/configuracion/{clave}")
def obtener_configuracion(clave: str, db: Session = Depends(get_db)):
    valor = RetencionService.obtener_configuracion(db, clave)
    if valor is None:
        return {"status": "Configuracion no encontrada", "clave": clave}
    return {"clave": clave, "valor": valor}

@router.delete("/configuracion/{clave}")
def eliminar_configuracion(clave: str, db: Session = Depends(get_db)):
    return RetencionService.eliminar_configuracion(db, clave)