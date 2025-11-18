from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.Usuario import Usuario
from util.permisosUser import canEditDelete
from util.database import get_db
from dtos.ArrendatarioDto import ArrendatarioDto, ArrendatarioDtoOut, ArrendatarioDtoModificacion
from services.ArrendatarioService import ArrendatarioService

router = APIRouter()

@router.get("", response_model=list[ArrendatarioDtoOut], description="Obtención de todos los arrendatarios.")
def listar_arrendatarios(db: Session = Depends(get_db)):
    """
    Endpoint para listar todos los arrendatarios.

    Args:
        db (Session): La sesión de la base de datos.

    Returns:
        list[ArrendatarioDtoOut]: Una lista de todos los arrendatarios.
    """
    return ArrendatarioService.listar_todos(db)

@router.get("/{arrendatario_id}", response_model=ArrendatarioDtoOut, description="Obtención de un arrendatario por id.")
def obtener_arrendatario(arrendatario_id: int, db: Session = Depends(get_db)):
    """
    Endpoint para obtener un arrendatario específico por su ID.

    Args:
        arrendatario_id (int): El ID del arrendatario a buscar.
        db (Session): La sesión de la base de datos.

    Returns:
        ArrendatarioDtoOut: El arrendatario encontrado.
    """
    return ArrendatarioService.obtener_por_id(db, arrendatario_id)

@router.post("", response_model=ArrendatarioDtoOut, description="Creación de un arrendatario.")
def crear_arrendatario(dto: ArrendatarioDto, db: Session = Depends(get_db) , current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para crear un nuevo arrendatario. Requiere permisos de edición.

    Args:
        dto (ArrendatarioDto): Los datos del nuevo arrendatario.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        ArrendatarioDtoOut: El arrendatario recién creado.
    """
    return ArrendatarioService.crear(db, dto)

@router.put("/{arrendatario_id}", response_model=ArrendatarioDtoOut, description="Modificación de un arrendatario por id.")
def actualizar_arrendatario(arrendatario_id: int, dto: ArrendatarioDtoModificacion, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para actualizar un arrendatario existente. Requiere permisos de edición.

    Args:
        arrendatario_id (int): El ID del arrendatario a actualizar.
        dto (ArrendatarioDtoModificacion): Los datos a modificar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        ArrendatarioDtoOut: El arrendatario actualizado.
    """
    return ArrendatarioService.actualizar(db, arrendatario_id, dto)

@router.delete("/{arrendatario_id}", description="Eliminación de un arrendatario por id.")
def eliminar_arrendatario(arrendatario_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para eliminar un arrendatario por su ID. Requiere permisos de edición.

    Args:
        arrendatario_id (int): El ID del arrendatario a eliminar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        dict: Un mensaje de confirmación.
    """
    ArrendatarioService.eliminar(db, arrendatario_id)
    return {"mensaje": "Arrendatario eliminado correctamente."}
