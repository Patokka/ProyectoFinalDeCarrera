from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.Usuario import Usuario
from dtos.ParticipacionArrendadorDto import ParticipacionArrendadorDtoOut
from util.permisosUser import canEditDelete
from util.database import get_db
from dtos.ArrendamientoDto import ArrendamientoDto, ArrendamientoDtoOut, ArrendamientoDtoModificacion
from services.ArrendamientoService import ArrendamientoService

router = APIRouter()

@router.get("", response_model=list[ArrendamientoDtoOut], description="Obtención de todos los arrendamientos.")
def listar_arrendamientos(db: Session = Depends(get_db)):
    """
    Endpoint para listar todos los arrendamientos.

    Args:
        db (Session): La sesión de la base de datos.

    Returns:
        list[ArrendamientoDtoOut]: Una lista de todos los arrendamientos.
    """
    return ArrendamientoService.listar_todos(db)

@router.get("/activos", response_model=list[ArrendamientoDtoOut], description="Obtención de todos los arrendamientos activos.")
def listar_arrendamientos_activos(db: Session = Depends(get_db)):
    """
    Endpoint para listar todos los arrendamientos que se encuentran en estado 'ACTIVO'.

    Args:
        db (Session): La sesión de la base de datos.

    Returns:
        list[ArrendamientoDtoOut]: Una lista de arrendamientos activos.
    """
    return ArrendamientoService.listar_activos(db)

@router.get("/participaciones/{arrendamiento_id}", response_model=list[ParticipacionArrendadorDtoOut], description="Obtención de las participaciones de un arrendamiento por id.")
def obtener_participaciones_arrendamiento(arrendamiento_id: int, db: Session = Depends(get_db)):
    """
    Endpoint para obtener todas las participaciones de arrendadores asociadas a un arrendamiento.

    Args:
        arrendamiento_id (int): El ID del arrendamiento.
        db (Session): La sesión de la base de datos.

    Returns:
        list[ParticipacionArrendadorDtoOut]: Lista de participaciones del arrendamiento.
    """
    return ArrendamientoService.obtener_participaciones_por_id(db, arrendamiento_id)

@router.get("/{arrendamiento_id}", response_model=ArrendamientoDtoOut, description="Obtención de un arrendamiento por id.")
def obtener_arrendamiento(arrendamiento_id: int, db: Session = Depends(get_db)):
    """
    Endpoint para obtener un arrendamiento específico por su ID.

    Args:
        arrendamiento_id (int): El ID del arrendamiento a buscar.
        db (Session): La sesión de la base de datos.

    Returns:
        ArrendamientoDtoOut: El arrendamiento encontrado.
    """
    return ArrendamientoService.obtener_por_id(db, arrendamiento_id)

@router.post("", response_model=ArrendamientoDtoOut, description="Creación de un arrendamiento.")
def crear_arrendamiento(dto: ArrendamientoDto, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para crear un nuevo arrendamiento. Requiere permisos de edición.

    Args:
        dto (ArrendamientoDto): Los datos del nuevo arrendamiento.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        ArrendamientoDtoOut: El arrendamiento recién creado.
    """
    return ArrendamientoService.crear(db, dto)

@router.put("/{arrendamiento_id}", response_model=ArrendamientoDtoOut, description="Actualización de un arrendamiento por id.")
def actualizar_arrendamiento(arrendamiento_id: int, dto: ArrendamientoDtoModificacion, db: Session = Depends(get_db) , current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para actualizar un arrendamiento existente. Requiere permisos de edición.

    Args:
        arrendamiento_id (int): El ID del arrendamiento a actualizar.
        dto (ArrendamientoDtoModificacion): Los datos a modificar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        ArrendamientoDtoOut: El arrendamiento actualizado.
    """
    return ArrendamientoService.actualizar(db, arrendamiento_id, dto)

@router.delete("/{arrendamiento_id}", description="Eliminación de un arrendamiento por id.")
def eliminar_arrendamiento(arrendamiento_id: int, db: Session = Depends(get_db) , current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para eliminar un arrendamiento por su ID. Requiere permisos de edición.

    Args:
        arrendamiento_id (int): El ID del arrendamiento a eliminar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        dict: Un mensaje de confirmación.
    """
    ArrendamientoService.eliminar(db, arrendamiento_id)
    return {"mensaje": "Arrendamiento eliminado correctamente."}

@router.post("/cancelar/{arrendamiento_id}", response_model=ArrendamientoDtoOut, description="Cancelación de un arrendamiento por id.")
def cancelar_arrendamiento(arrendamiento_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para cambiar el estado de un arrendamiento a 'CANCELADO'. Requiere permisos de edición.

    Args:
        arrendamiento_id (int): El ID del arrendamiento a cancelar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        ArrendamientoDtoOut: El arrendamiento con su estado actualizado.
    """
    return ArrendamientoService.cancelar_arrendamiento(db, arrendamiento_id)

@router.post("/finalizar/{arrendamiento_id}", response_model=ArrendamientoDtoOut, description="Finalizar un arrendamiento por id.")
def finalizar_arrendamiento(arrendamiento_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para cambiar el estado de un arrendamiento a 'FINALIZADO'. Requiere permisos de edición.

    Args:
        arrendamiento_id (int): El ID del arrendamiento a finalizar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        ArrendamientoDtoOut: El arrendamiento con su estado actualizado.
    """
    return ArrendamientoService.finalizar_arrendamiento(db, arrendamiento_id)
