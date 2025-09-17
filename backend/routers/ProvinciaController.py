from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from dtos.LocalidadDto import LocalidadDtoOut
from util.database import get_db
from dtos.ProvinciaDto import ProvinciaDto, ProvinciaDtoOut, ProvinciaDtoModificacion
from services.UbicacionService import UbicacionService

router = APIRouter()

@router.get("/", response_model=list[ProvinciaDtoOut], description="Obtención de todas las provincias.")
def listar_provincias(db: Session = Depends(get_db)):
    return UbicacionService.listar_provincias(db)

@router.get("/{provincia_id}/localidades", response_model=list[LocalidadDtoOut], description="Obtención de las localidades por el id de una provincia.")
def obtener_provincia(provincia_id: int, db: Session = Depends(get_db)):
    return UbicacionService.obtener_localidades_provincia(db, provincia_id)

@router.get("/{provincia_id}", response_model=ProvinciaDtoOut, description="Obtención de una provincia por id.")
def obtener_provincia(provincia_id: int, db: Session = Depends(get_db)):
    return UbicacionService.obtener_provincia_por_id(db, provincia_id)

@router.post("/", response_model=ProvinciaDtoOut, description="Creación de una provincia.")
def crear_provincia(dto: ProvinciaDto, db: Session = Depends(get_db)):
    return UbicacionService.crear_provincia(db, dto)

@router.put("/{provincia_id}", response_model=ProvinciaDtoOut, description="Actualización de una provincia por id.")
def actualizar_provincia(provincia_id: int, dto: ProvinciaDtoModificacion, db: Session = Depends(get_db)):
    return UbicacionService.actualizar_provincia(db, provincia_id, dto)

@router.delete("/{provincia_id}", description="Eliminación de una localida por id.")
def eliminar_provincia(provincia_id: int, db: Session = Depends(get_db)):
    UbicacionService.eliminar_provincia(db, provincia_id)
    return {"mensaje": "Provincia eliminada correctamente."}