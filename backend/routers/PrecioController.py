from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..util.database import get_db
from ..dtos.PrecioDto import PrecioDto, PrecioDtoOut, PrecioDtoModificacion
from ..services.PrecioService import PrecioService

router = APIRouter()

@router.get("/", response_model=list[PrecioDtoOut], description="Obtención de todos los precios.")
def listar_precios(db: Session = Depends(get_db)):
    return PrecioService.listar_todos_precios(db)

@router.get("/{precio_id}", response_model=PrecioDtoOut, description="Obtención de un precio por id.")
def obtener_precio(precio_id: int, db: Session = Depends(get_db)):
    return PrecioService.obtener_por_id(db, precio_id)

@router.post("/", response_model=PrecioDtoOut, description="Creación de un precio.")
def crear_precio(dto: PrecioDto, db: Session = Depends(get_db)):
    return PrecioService.crear(db, dto)

@router.put("/{precio_id}", response_model=PrecioDtoOut, description="Actualización de un precio por id.")
def actualizar_precio(precio_id: int, dto: PrecioDtoModificacion, db: Session = Depends(get_db)):
    return PrecioService.actualizar(db, precio_id, dto)

@router.delete("/{precio_id}", description="Eliminación de un precio por id.")
def eliminar_precio(precio_id: int, db: Session = Depends(get_db)):
    PrecioService.eliminar(db, precio_id)
    return {"mensaje": "Precio eliminado correctamente."}