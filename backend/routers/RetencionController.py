from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..util.database import get_db
from ..dtos.RetencionDto import RetencionDto, RetencionDtoOut, RetencionDtoModificacion
from ..services.RetencionService import RetencionService

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