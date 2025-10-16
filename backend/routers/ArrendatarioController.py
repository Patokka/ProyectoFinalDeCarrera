from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.Usuario import Usuario
from util.permisosUser import canEditDelete
from util.database import get_db
from dtos.ArrendatarioDto import ArrendatarioDto, ArrendatarioDtoOut, ArrendatarioDtoModificacion
from services.ArrendatarioService import ArrendatarioService

router = APIRouter()

@router.get("/", response_model=list[ArrendatarioDtoOut], description="Obtención de todos los arrendatarios.")
def listar_arrendatarios(db: Session = Depends(get_db)):
    return ArrendatarioService.listar_todos(db)

@router.get("/{arrendatario_id}", response_model=ArrendatarioDtoOut, description="Obtención de un arrendatario por id.")
def obtener_arrendatario(arrendatario_id: int, db: Session = Depends(get_db)):
    return ArrendatarioService.obtener_por_id(db, arrendatario_id)

@router.post("/", response_model=ArrendatarioDtoOut, description="Creación de un arrendatario.")
def crear_arrendatario(dto: ArrendatarioDto, db: Session = Depends(get_db) , current_user: Usuario = Depends(canEditDelete)):
    return ArrendatarioService.crear(db, dto)

@router.put("/{arrendatario_id}", response_model=ArrendatarioDtoOut, description="Modificación de un arrendatario por id.")
def actualizar_arrendatario(arrendatario_id: int, dto: ArrendatarioDtoModificacion, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    return ArrendatarioService.actualizar(db, arrendatario_id, dto)

@router.delete("/{arrendatario_id}", description="Eliminación de un arrendatario por id.")
def eliminar_arrendatario(arrendatario_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    ArrendatarioService.eliminar(db, arrendatario_id)
    return {"mensaje": "Arrendatario eliminado correctamente."}