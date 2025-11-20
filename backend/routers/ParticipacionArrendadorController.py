from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.Usuario import Usuario
from util.permisosUser import canEditDelete
from util.database import get_db
from dtos.ParticipacionArrendadorDto import ParticipacionArrendadorDto, ParticipacionArrendadorDtoOut, ParticipacionArrendadorDtoModificacion
from services.ArrendamientoService import ArrendamientoService

router = APIRouter()

@router.get("", response_model=list[ParticipacionArrendadorDtoOut], description="Obtención de todas las participaciones.")
def listar_participaciones(db: Session = Depends(get_db)):
    """
    Endpoint para listar todas las participaciones de arrendadores.
    Args:
        db (Session): La sesión de la base de datos.
    Returns:
        list[ParticipacionArrendadorDtoOut]: Una lista de todas las participaciones.
    """
    return ArrendamientoService.listar_participaciones(db)

@router.get("/{participacion_id}", response_model=ParticipacionArrendadorDtoOut, description="Obtención de una participación por id.")
def obtener_participacion(participacion_id: int, db: Session = Depends(get_db)):
    """
    Endpoint para obtener una participación específica por su ID.
    Args:
        participacion_id (int): El ID de la participación a buscar.
        db (Session): La sesión de la base de datos.
    Returns:
        ParticipacionArrendadorDtoOut: La participación encontrada.
    """
    return ArrendamientoService.obtener_participacion_por_id(db, participacion_id)

@router.post("", response_model=ParticipacionArrendadorDtoOut, description="Creación de una participación.")
def crear_participacion(dto: ParticipacionArrendadorDto, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para crear una nueva participación de arrendador en un arrendamiento.
    Requiere permisos de edición.
    Args:
        dto (ParticipacionArrendadorDto): Los datos de la nueva participación.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.
    Returns:
        ParticipacionArrendadorDtoOut: La participación recién creada.
    """
    return ArrendamientoService.crear_participacion(db, dto)

@router.put("/{participacion_id}", response_model=ParticipacionArrendadorDtoOut, description="Modificación de una participación por id.")
def actualizar_participacion(participacion_id: int, dto: ParticipacionArrendadorDtoModificacion, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para actualizar una participación existente. Requiere permisos de edición.
    Args:
        participacion_id (int): El ID de la participación a actualizar.
        dto (ParticipacionArrendadorDtoModificacion): Los datos a modificar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.
    Returns:
        ParticipacionArrendadorDtoOut: La participación actualizada.
    """
    return ArrendamientoService.actualizar_participacion(db, participacion_id, dto)

@router.delete("/{participacion_id}", description="Eliminación de una participación por id.")
def eliminar_participacion(participacion_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para eliminar una participación por su ID. Requiere permisos de edición.
    Args:
        participacion_id (int): El ID de la participación a eliminar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.
    Returns:
        dict: Un mensaje de confirmación.
    """
    ArrendamientoService.eliminar_participacion(db, participacion_id)
    return {"mensaje": "Participación eliminada correctamente."}