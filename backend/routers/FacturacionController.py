from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.Usuario import Usuario
from util.permisosUser import canEditDelete
from util.database import get_db
from dtos.FacturacionDto import  FacturacionDtoOut, FacturacionDtoModificacion
from services.FacturacionService import FacturacionService

router = APIRouter()

@router.get("", response_model=list[FacturacionDtoOut], description="Obtención de todas las facturación.")
def listar_facturaciones(db: Session = Depends(get_db)):
    """
    Endpoint para listar todas las facturaciones.
    Args:
        db (Session): La sesión de la base de datos.
    Returns:
        list[FacturacionDtoOut]: Una lista de todas las facturaciones.
    """
    return FacturacionService.listar_todos(db)

@router.get("/{facturacion_id}", response_model=FacturacionDtoOut, description="Obtención de una facturación por id.")
def obtener_facturacion(facturacion_id: int, db: Session = Depends(get_db)):
    """
    Endpoint para obtener una facturación específica por su ID.
    Args:
        facturacion_id (int): El ID de la facturación a buscar.
        db (Session): La sesión de la base de datos.
    Returns:
        FacturacionDtoOut: La facturación encontrada.
    """
    return FacturacionService.obtener_por_id(db, facturacion_id)

@router.post("/crear/{pago_id}", response_model=FacturacionDtoOut, description="Creación de una facturación.")
def crear_facturacion(pago_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para crear una nueva facturación a partir de un ID de pago. Requiere permisos de edición.
    Args:
        pago_id (int): El ID del pago a partir del cual se creará la facturación.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.
    Returns:
        FacturacionDtoOut: La facturación recién creada.
    """
    return FacturacionService.crear(db, pago_id)

@router.put("/{facturacion_id}", response_model=FacturacionDtoOut, description="Actualización de una facturación por id.")
def actualizar_facturacion(facturacion_id: int, dto: FacturacionDtoModificacion, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para actualizar una facturación existente. Requiere permisos de edición.
    Args:
        facturacion_id (int): El ID de la facturación a actualizar.
        dto (FacturacionDtoModificacion): Los datos a modificar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.
    Returns:
        FacturacionDtoOut: La facturación actualizada.
    """
    return FacturacionService.actualizar(db, facturacion_id, dto)

@router.delete("/{facturacion_id}", description="Eliminación de una facturación por id.")
def eliminar_facturacion(facturacion_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para eliminar una facturación por su ID. Requiere permisos de edición.
    Args:
        facturacion_id (int): El ID de la facturación a eliminar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.
    Returns:
        dict: Un mensaje de confirmación.
    """
    FacturacionService.eliminar(db, facturacion_id)
    return {"mensaje": "Facturación eliminada correctamente."}

@router.get("/arrendador/{arrendador_id}", response_model=list[FacturacionDtoOut], description="Obtención de todas las facturaciones de un arrendador.")
def obtener_facturaciones_arrendador(arrendador_id: int, db: Session = Depends(get_db)):
    """
    Endpoint para obtener todas las facturaciones asociadas a un arrendador.
    Args:
        arrendador_id (int): El ID del arrendador.
        db (Session): La sesión de la base de datos.
    Returns:
        list[FacturacionDtoOut]: Lista de facturaciones del arrendador.
    """
    return FacturacionService.obtener_facturaciones_arrendador(db, arrendador_id)

@router.get("/arrendatario/{arrendatario_id}", response_model=list[FacturacionDtoOut], description="Obtención de todas las facturaciones de un arrendatario.")
def obtener_facturaciones_arrendador(arrendatario_id: int, db: Session = Depends(get_db)):
    """
    Endpoint para obtener todas las facturaciones asociadas a un arrendatario.
    Args:
        arrendatario_id (int): El ID del arrendatario.
        db (Session): La sesión de la base de datos.
    Returns:
        list[FacturacionDtoOut]: Lista de facturaciones del arrendatario.
    """
    return FacturacionService.obtener_facturaciones_arrendatario(db, arrendatario_id)