from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.Usuario import Usuario
from util.permisosUser import canEditDelete
from util.database import get_db
from dtos.LocalidadDto import LocalidadDtoOut
from dtos.ProvinciaDto import ProvinciaDto, ProvinciaDtoOut, ProvinciaDtoModificacion
from services.UbicacionService import UbicacionService

router = APIRouter()

@router.get("", response_model=list[ProvinciaDtoOut], description="Obtención de todas las provincias.")
def listar_provincias(db: Session = Depends(get_db)):
    """
    Endpoint para listar todas las provincias.
    Args:
        db (Session): La sesión de la base de datos.
    Returns:
        list[ProvinciaDtoOut]: Una lista de todas las provincias.
    """
    return UbicacionService.listar_provincias(db)

@router.get("/{provincia_id}/localidades", response_model=list[LocalidadDtoOut], description="Obtención de las localidades por el id de una provincia.")
def obtener_provincia(provincia_id: int, db: Session = Depends(get_db)):
    """
    Endpoint para obtener todas las localidades de una provincia específica.
    Args:
        provincia_id (int): El ID de la provincia.
        db (Session): La sesión de la base de datos.
    Returns:
        list[LocalidadDtoOut]: Lista de localidades de la provincia.
    """
    return UbicacionService.obtener_localidades_provincia(db, provincia_id)

@router.get("/{provincia_id}", response_model=ProvinciaDtoOut, description="Obtención de una provincia por id.")
def obtener_provincia(provincia_id: int, db: Session = Depends(get_db)):
    """
    Endpoint para obtener una provincia específica por su ID.
    Args:
        provincia_id (int): El ID de la provincia a buscar.
        db (Session): La sesión de la base de datos.
    Returns:
        ProvinciaDtoOut: La provincia encontrada.
    """
    return UbicacionService.obtener_provincia_por_id(db, provincia_id)

@router.post("", response_model=ProvinciaDtoOut, description="Creación de una provincia.")
def crear_provincia(dto: ProvinciaDto, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para crear una nueva provincia. Requiere permisos de edición.
    Args:
        dto (ProvinciaDto): Los datos de la nueva provincia.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.
    Returns:
        ProvinciaDtoOut: La provincia recién creada.
    """
    return UbicacionService.crear_provincia(db, dto)

@router.put("/{provincia_id}", response_model=ProvinciaDtoOut, description="Actualización de una provincia por id.")
def actualizar_provincia(provincia_id: int, dto: ProvinciaDtoModificacion, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para actualizar una provincia existente. Requiere permisos de edición.
    Args:
        provincia_id (int): El ID de la provincia a actualizar.
        dto (ProvinciaDtoModificacion): Los datos a modificar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.
    Returns:
        ProvinciaDtoOut: La provincia actualizada.
    """
    return UbicacionService.actualizar_provincia(db, provincia_id, dto)

@router.delete("/{provincia_id}", description="Eliminación de una localida por id.")
def eliminar_provincia(provincia_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para eliminar una provincia por su ID. Requiere permisos de edición.
    Args:
        provincia_id (int): El ID de la provincia a eliminar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.
    Returns:
        dict: Un mensaje de confirmación.
    """
    UbicacionService.eliminar_provincia(db, provincia_id)
    return {"mensaje": "Provincia eliminada correctamente."}