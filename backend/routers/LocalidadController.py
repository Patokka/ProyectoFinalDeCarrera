from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from util.database import get_db
from dtos.LocalidadDto import LocalidadDto, LocalidadDtoOut, LocalidadDtoModificacion
from services.UbicacionService import UbicacionService

router = APIRouter()

@router.get("/", response_model=list[LocalidadDtoOut], description="Obtención de todas las localidades.")
def listar_localidades(db: Session = Depends(get_db)):
    return UbicacionService.listar_localidades(db)

@router.get("/{localidad_id}", response_model=LocalidadDtoOut, description="Obtención de una localidad por id.")
def obtener_localidad(localidad_id: int, db: Session = Depends(get_db)):
    return UbicacionService.obtener_localidad_por_id(db, localidad_id)

@router.post("/", response_model=LocalidadDtoOut, description="Creación de una localidad.")
def crear_localidad(dto: LocalidadDto, db: Session = Depends(get_db)):
    return UbicacionService.crear_localidad(db, dto)

@router.put("/{localidad_id}", response_model=LocalidadDtoOut, description="Actualización de una localidad por id.")
def actualizar_localidad(localidad_id: int, dto: LocalidadDtoModificacion, db: Session = Depends(get_db)):
    return UbicacionService.actualizar_localidad(db, localidad_id, dto)

@router.delete("/{localidad_id}", description="Eliminación de una localida por id.")
def eliminar_localidad(localidad_id: int, db: Session = Depends(get_db)):
    UbicacionService.eliminar_localidad(db, localidad_id)
    return {"mensaje": "Localidad eliminada correctamente."}