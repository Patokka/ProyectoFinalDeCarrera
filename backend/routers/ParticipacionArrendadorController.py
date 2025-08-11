from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..util.database import get_db
from ..dtos.ParticipacionArrendadorDto import ParticipacionArrendadorDto, ParticipacionArrendadorDtoOut, ParticipacionArrendadorDtoModificacion
from ..services.ArrendamientoService import ArrendamientoService

router = APIRouter()

@router.get("/", response_model=list[ParticipacionArrendadorDtoOut], description="Obtención de todas las participaciones.")
def listar_participaciones(db: Session = Depends(get_db)):
    return ArrendamientoService.listar_participaciones(db)

@router.get("/{participacion_id}", response_model=ParticipacionArrendadorDtoOut, description="Obtención de una participación por id.")
def obtener_participacion(participacion_id: int, db: Session = Depends(get_db)):
    return ArrendamientoService.obtener_participacion_por_id(db, participacion_id)

@router.post("/", response_model=ParticipacionArrendadorDtoOut, description="Creación de una participación.")
def crear_participacion(dto: ParticipacionArrendadorDto, db: Session = Depends(get_db)):
    return ArrendamientoService.crear_participacion(db, dto)

@router.put("/{participacion_id}", response_model=ParticipacionArrendadorDtoOut, description="Modificación de una participación por id.")
def actualizar_participacion(participacion_id: int, dto: ParticipacionArrendadorDtoModificacion, db: Session = Depends(get_db)):
    return ArrendamientoService.actualizar_participacion(db, participacion_id, dto)

@router.delete("/{participacion_id}", description="Eliminación de una participación por id.")
def eliminar_participacion(participacion_id: int, db: Session = Depends(get_db)):
    ArrendamientoService.eliminar_participacion(db, participacion_id)
    return {"mensaje": "Participación eliminada correctamente."}