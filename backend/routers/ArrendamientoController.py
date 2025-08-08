from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..util.database import get_db
from ..dtos.ArrendamientoDto import ArrendamientoDto, ArrendamientoDtoOut, ArrendamientoDtoModificacion
from ..services.ArrendamientoService import ArrendamientoService

router = APIRouter()

@router.get("/", response_model=list[ArrendamientoDtoOut], description="Obtención de todos los arrendamientos.")
def listar_arrendamientos(db: Session = Depends(get_db)):
    return ArrendamientoService.listar_todos(db)

@router.get("/{arrendamiento_id}", response_model=ArrendamientoDtoOut, description="Obtención de un arrendamiento por id.")
def obtener_arrendamiento(arrendamiento_id: int, db: Session = Depends(get_db)):
    return ArrendamientoService.obtener_por_id(db, arrendamiento_id)

@router.post("/", response_model=ArrendamientoDtoOut, description="Actualización de un arrendamiento por id.")
def crear_arrendamiento(dto: ArrendamientoDto, db: Session = Depends(get_db)):
    return ArrendamientoService.crear(db, dto)

@router.put("/{arrendamiento_id}", response_model=ArrendamientoDtoOut, description="Creación de un arrendamiento.")
def actualizar_arrendamiento(arrendamiento_id: int, dto: ArrendamientoDtoModificacion, db: Session = Depends(get_db)):
    return ArrendamientoService.actualizar(db, arrendamiento_id, dto)

@router.delete("/{arrendamiento_id}", description="Eliminación de un arrendamiento por id.")
def eliminar_arrendamiento(arrendamiento_id: int, db: Session = Depends(get_db)):
    ArrendamientoService.eliminar(db, arrendamiento_id)
    return {"mensaje": "Arrendamiento eliminado correctamente."}
