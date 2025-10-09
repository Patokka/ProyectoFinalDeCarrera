from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from model.Usuario import Usuario
from util.permisosUser import admin_required, get_current_user
from util.database import get_db
from dtos.UsuarioDto import UsuarioDto, UsuarioDtoOut, UsuarioDtoModificacion
from services.UsuarioService import UsuarioService

router = APIRouter()


@router.put("/cambiar-contrasena", description="Cambiar la contraseña del usuario logueado")
def cambiar_contrasena_usuario(dto: UsuarioDtoModificacion, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        UsuarioService.cambiar_contrasena(db=db, usuario_id=current_user.id, contrasena_actual=dto.contrasenaActual, contrasena_nueva=dto.contrasenaNueva)
        return {"mensaje": "Contraseña actualizada con éxito"}
    except HTTPException as e:
        # Si ya es una excepción HTTP de FastAPI, la relanzamos tal cual
        raise e
    except Exception as e:
        # Solo si es otro tipo de error (por ejemplo, ValueError o bug interno)
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=list[UsuarioDtoOut], description="Obtención de todos los usuarios.")
def listar_usuario(db: Session = Depends(get_db),  current_user = Depends(get_current_user)):
    return UsuarioService.listar_todos(db)

@router.get("/{usuario_id}", response_model=UsuarioDtoOut, description="Obtención de un usuario por id.")
def obtener_usuario(usuario_id: int, db: Session = Depends(get_db),  current_user = Depends(get_current_user)):
    return UsuarioService.obtener_por_id(db, usuario_id)

@router.post("/", response_model=UsuarioDtoOut, description="Creación de un usuario.")
def crear_usuario(dto: UsuarioDto, db: Session = Depends(get_db), current_user: Usuario = Depends(admin_required)):
    return UsuarioService.crear(db, dto)

@router.put("/{usuario_id}", response_model=UsuarioDtoOut, description="Actualización de un usuario por id.")
def actualizar_usuario(usuario_id: int, dto: UsuarioDto, current_user: Usuario = Depends(admin_required), db: Session = Depends(get_db)):
    return UsuarioService.actualizar(db, usuario_id, dto)

@router.delete("/{usuario_id}", description="Eliminación de un usuario por id.")
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(admin_required)):
    UsuarioService.eliminar(db, usuario_id, current_user)
    return {"mensaje": "Usuario eliminado correctamente."}
