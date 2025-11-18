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
    """
    Endpoint para listar todos los arrendadores existentes en la base de datos.

    Args:
        db (Session): La sesión de la base de datos.

    Returns:
        list[ArrendadorDtoOut]: Una lista de todos los arrendadores.
    """
    return ArrendadorService.listar_todos(db)

@router.get("/{arrendador_id}", response_model=ArrendadorDtoOut, description="Obtención de un arrendador por id.")
def obtener_arrendador(arrendador_id: int, db: Session = Depends(get_db)):
    """
    Endpoint para obtener un arrendador específico por su ID.

    Args:
        arrendador_id (int): El ID del arrendador a buscar.
        db (Session): La sesión de la base de datos.

    Returns:
        ArrendadorDtoOut: El arrendador encontrado.
    """
    return ArrendadorService.obtener_por_id(db, arrendador_id)

@router.post("", response_model=ArrendadorDtoOut, description="Creación de un arrendador.")
def crear_arrendador(dto: ArrendadorDto, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para crear un nuevo arrendador. Requiere permisos de edición/eliminación.

    Args:
        dto (ArrendadorDto): Los datos del nuevo arrendador.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        ArrendadorDtoOut: El arrendador recién creado.
    """
    return ArrendadorService.crear(db, dto)

@router.put("/{arrendador_id}", response_model=ArrendadorDtoOut, description="Actualización de un arrendador por id.")
def actualizar_arrendador(arrendador_id: int, dto: ArrendadorDtoModificacion, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para actualizar un arrendador existente. Requiere permisos de edición/eliminación.

    Args:
        arrendador_id (int): El ID del arrendador a actualizar.
        dto (ArrendadorDtoModificacion): Los datos a modificar del arrendador.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        ArrendadorDtoOut: El arrendador actualizado.
    """
    return ArrendadorService.actualizar(db, arrendador_id, dto)

@router.delete("/{arrendador_id}", description="Eliminación de un arrendador por id.")
def eliminar_arrendador(arrendador_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para eliminar un arrendador por su ID. Requiere permisos de edición/eliminación.

    Args:
        arrendador_id (int): El ID del arrendador a eliminar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        dict: Un mensaje de confirmación.
    """
    ArrendadorService.eliminar(db, arrendador_id)
    return {"mensaje": "Arrendador eliminado correctamente."}
