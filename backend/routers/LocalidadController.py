from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.Usuario import Usuario
from util.permisosUser import canEditDelete
from util.database import get_db
from dtos.LocalidadDto import LocalidadDto, LocalidadDtoOut, LocalidadDtoModificacion
from services.UbicacionService import UbicacionService

router = APIRouter()

@router.get("", response_model=list[LocalidadDtoOut], description="Obtención de todas las localidades.")
def listar_localidades(db: Session = Depends(get_db)):
    """
    Endpoint para listar todas las localidades.

    Args:
        db (Session): La sesión de la base de datos.

    Returns:
        list[LocalidadDtoOut]: Una lista de todas las localidades.
    """
    return UbicacionService.listar_localidades(db)

@router.get("/{localidad_id}", response_model=LocalidadDtoOut, description="Obtención de una localidad por id.")
def obtener_localidad(localidad_id: int, db: Session = Depends(get_db)):
    """
    Endpoint para obtener una localidad específica por su ID.

    Args:
        localidad_id (int): El ID de la localidad a buscar.
        db (Session): La sesión de la base de datos.

    Returns:
        LocalidadDtoOut: La localidad encontrada.
    """
    return UbicacionService.obtener_localidad_por_id(db, localidad_id)

@router.post("", response_model=LocalidadDtoOut, description="Creación de una localidad.")
def crear_localidad(dto: LocalidadDto, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para crear una nueva localidad. Requiere permisos de edición.

    Args:
        dto (LocalidadDto): Los datos de la nueva localidad.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        LocalidadDtoOut: La localidad recién creada.
    """
    return UbicacionService.crear_localidad(db, dto)

@router.put("/{localidad_id}", response_model=LocalidadDtoOut, description="Actualización de una localidad por id.")
def actualizar_localidad(localidad_id: int, dto: LocalidadDtoModificacion, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para actualizar una localidad existente. Requiere permisos de edición.

    Args:
        localidad_id (int): El ID de la localidad a actualizar.
        dto (LocalidadDtoModificacion): Los datos a modificar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        LocalidadDtoOut: La localidad actualizada.
    """
    return UbicacionService.actualizar_localidad(db, localidad_id, dto)

@router.delete("/{localidad_id}", description="Eliminación de una localida por id.")
def eliminar_localidad(localidad_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para eliminar una localidad por su ID. Requiere permisos de edición.

    Args:
        localidad_id (int): El ID de la localidad a eliminar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        dict: Un mensaje de confirmación.
    """
    UbicacionService.eliminar_localidad(db, localidad_id)
    return {"mensaje": "Localidad eliminada correctamente."}
