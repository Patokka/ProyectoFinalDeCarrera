from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.Usuario import Usuario
from util.permisosUser import canEditDelete
from util.database import get_db
from dtos.ArrendadorDto import ArrendadorDto, ArrendadorDtoOut, ArrendadorDtoModificacion
from services.ArrendadorService import ArrendadorService

router = APIRouter()

@router.get("", response_model=list[ArrendadorDtoOut], description="Obtención de todos los arrrendadores.")
def listar_arrendadores(db: Session = Depends(get_db)):
    return ArrendadorService.listar_todos(db)

@router.get("/{arrendador_id}", response_model=ArrendadorDtoOut, description="Obtención de un arrendador por id.")
def obtener_arrendador(arrendador_id: int, db: Session = Depends(get_db)):
    return ArrendadorService.obtener_por_id(db, arrendador_id)

@router.post("", response_model=ArrendadorDtoOut, description="Creación de un arrendador.")
def crear_arrendador(dto: ArrendadorDto, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    return ArrendadorService.crear(db, dto)

@router.put("/{arrendador_id}", response_model=ArrendadorDtoOut, description="Actualización de un arrendador por id.")
def actualizar_arrendador(arrendador_id: int, dto: ArrendadorDtoModificacion, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    return ArrendadorService.actualizar(db, arrendador_id, dto)

@router.delete("/{arrendador_id}", description="Eliminación de un arrendador por id.")
def eliminar_arrendador(arrendador_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    ArrendadorService.eliminar(db, arrendador_id)
    return {"mensaje": "Arrendador eliminado correctamente."}