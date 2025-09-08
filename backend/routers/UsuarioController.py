from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from model.Usuario import Usuario
from util.permisosUser import admin_required
from util.database import get_db
from dtos.UsuarioDto import UsuarioDto, UsuarioDtoOut, UsuarioDtoModificacion
from services.UsuarioService import UsuarioService

router = APIRouter()

@router.get("/", response_model=list[UsuarioDtoOut], description="Obtención de todos los usuarios.")
def listar_usuario(db: Session = Depends(get_db)):
    return UsuarioService.listar_todos(db)

@router.get("/{usuario_id}", response_model=UsuarioDtoOut, description="Obtención de un usuario por id.")
def obtener_usuario(usuario_id: int, db: Session = Depends(get_db)):
    return UsuarioService.obtener_por_id(db, usuario_id)

@router.post("/", response_model=UsuarioDtoOut, description="Creación de un usuario.")
def crear_usuario(dto: UsuarioDto, db: Session = Depends(get_db)):
    return UsuarioService.crear(db, dto)

@router.put("/{usuario_id}", response_model=UsuarioDtoOut, description="Actualización de un usuario por id.")
def actualizar_usuario(usuario_id: int, dto: UsuarioDtoModificacion, db: Session = Depends(get_db)):
    return UsuarioService.actualizar(db, usuario_id, dto)

@router.delete("/{usuario_id}", description="Eliminación de un usuario por id.")
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(admin_required)):
    UsuarioService.eliminar(db, usuario_id)
    return {"mensaje": "Usuario eliminado correctamente."}