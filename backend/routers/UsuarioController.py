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
    """
    Endpoint para que el usuario autenticado pueda cambiar su propia contraseña.

    Args:
        dto (UsuarioDtoModificacion): Contiene la contraseña actual y la nueva.
        current_user (Usuario): El usuario autenticado, inyectado por `get_current_user`.
        db (Session): La sesión de la base de datos.

    Returns:
        dict: Un mensaje de confirmación.
    """
    try:
        UsuarioService.cambiar_contrasena(db=db, usuario_id=current_user.id, contrasena_actual=dto.contrasenaActual, contrasena_nueva=dto.contrasenaNueva)
        return {"mensaje": "Contraseña actualizada con éxito"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=list[UsuarioDtoOut], description="Obtención de todos los usuarios.")
def listar_usuario(db: Session = Depends(get_db),  current_user = Depends(get_current_user)):
    """
    Endpoint para listar todos los usuarios. Requiere autenticación.

    Args:
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado.

    Returns:
        list[UsuarioDtoOut]: Una lista de todos los usuarios.
    """
    return UsuarioService.listar_todos(db)

@router.get("/{usuario_id}", response_model=UsuarioDtoOut, description="Obtención de un usuario por id.")
def obtener_usuario(usuario_id: int, db: Session = Depends(get_db),  current_user = Depends(get_current_user)):
    """
    Endpoint para obtener un usuario específico por su ID. Requiere autenticación.

    Args:
        usuario_id (int): El ID del usuario a buscar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado.

    Returns:
        UsuarioDtoOut: El usuario encontrado.
    """
    return UsuarioService.obtener_por_id(db, usuario_id)

@router.post("", response_model=UsuarioDtoOut, description="Creación de un usuario.")
def crear_usuario(dto: UsuarioDto, db: Session = Depends(get_db), current_user: Usuario = Depends(admin_required)):
    """
    Endpoint para crear un nuevo usuario. Requiere permisos de administrador.

    Args:
        dto (UsuarioDto): Los datos del nuevo usuario.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario administrador autenticado.

    Returns:
        UsuarioDtoOut: El usuario recién creado.
    """
    return UsuarioService.crear(db, dto)

@router.put("/{usuario_id}", response_model=UsuarioDtoOut, description="Actualización de un usuario por id.")
def actualizar_usuario(usuario_id: int, dto: UsuarioDto, current_user: Usuario = Depends(admin_required), db: Session = Depends(get_db)):
    """
    Endpoint para actualizar un usuario existente. Requiere permisos de administrador.

    Args:
        usuario_id (int): El ID del usuario a actualizar.
        dto (UsuarioDto): Los datos a modificar.
        current_user (Usuario): El usuario administrador autenticado.
        db (Session): La sesión de la base de datos.

    Returns:
        UsuarioDtoOut: El usuario actualizado.
    """
    return UsuarioService.actualizar(db, usuario_id, dto)

@router.delete("/{usuario_id}", description="Eliminación de un usuario por id.")
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(admin_required)):
    """
    Endpoint para eliminar un usuario por su ID. Requiere permisos de administrador.

    Args:
        usuario_id (int): El ID del usuario a eliminar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario administrador autenticado.

    Returns:
        dict: Un mensaje de confirmación.
    """
    UsuarioService.eliminar(db, usuario_id, current_user)
    return {"mensaje": "Usuario eliminado correctamente."}
