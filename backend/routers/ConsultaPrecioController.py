from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..util.database import get_db
from ..dtos.ConsultaPrecioDto import ConsultaPrecioDto, ConsultaPrecioDtoOut, ConsultaPrecioDtoModificacion
from ..services.PrecioService import PrecioService

router = APIRouter()

@router.get("/", response_model=list[ConsultaPrecioDtoOut], description="Obtención de todos las consultas de precios.")
def listar_consultas(db: Session = Depends(get_db)):
    return PrecioService.listar_todos_precios(db)

@router.get("/{consulta_precio_id}", response_model=ConsultaPrecioDtoOut, description="Obtención de una consulta de precio por id.")
def obtener_consulta(consulta_precio_id: int, db: Session = Depends(get_db)):
    return PrecioService.obtener_por_id(db, consulta_precio_id)

@router.post("/", response_model=ConsultaPrecioDtoOut, description="Creación de una consulta de precio.")
def crear_consulta(dto: ConsultaPrecioDto, db: Session = Depends(get_db)):
    return PrecioService.crear(db, dto)

@router.put("/{consulta_precio_id}", response_model=ConsultaPrecioDtoOut, description="Actualización de una consulta de precio por id.")
def actualizar_consulta(consulta_precio_id: int, dto: ConsultaPrecioDtoModificacion, db: Session = Depends(get_db)):
    return PrecioService.actualizar(db, consulta_precio_id, dto)

@router.delete("/{consulta_precio_id}", description="Eliminación de una consulta de precio por id.")
def eliminar_consulta(consulta_precio_id: int, db: Session = Depends(get_db)):
    PrecioService.eliminar(db, consulta_precio_id)
    return {"mensaje": "Consulta de precio eliminada correctamente."}