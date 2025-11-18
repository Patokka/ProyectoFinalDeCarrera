from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from model.Usuario import Usuario
from util.database import get_db
from util.permisosUser import canEditDelete
from dtos.ConfiguracionDto import ConfiguracionDtoModificacion
from dtos.RetencionDto import RetencionDto, RetencionDtoOut, RetencionDtoModificacion
from services.RetencionService import RetencionService


router = APIRouter()

@router.get("", response_model=list[RetencionDtoOut], description="Obtención de todas las retenciones.")
def listar_retenciones(db: Session = Depends(get_db)):
    """
    Endpoint para listar todas las retenciones.

    Args:
        db (Session): La sesión de la base de datos.

    Returns:
        list[RetencionDtoOut]: Una lista de todas las retenciones.
    """
    return RetencionService.listar_todos(db)

@router.get("/{retencion_id}", response_model=RetencionDtoOut, description="Obtención de una retención por id.")
def obtener_retencion(retencion_id: int, db: Session = Depends(get_db)):
    """
    Endpoint para obtener una retención específica por su ID.

    Args:
        retencion_id (int): El ID de la retención a buscar.
        db (Session): La sesión de la base de datos.

    Returns:
        RetencionDtoOut: La retención encontrada.
    """
    return RetencionService.obtener_por_id(db, retencion_id)

@router.post("", response_model=RetencionDtoOut, description="Creación de una retención.")
def crear_retencion(dto: RetencionDto, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para crear una nueva retención. Requiere permisos de edición.

    Args:
        dto (RetencionDto): Los datos de la nueva retención.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        RetencionDtoOut: La retención recién creada.
    """
    return RetencionService.crear(db, dto)

@router.put("/{retencion_id}", response_model=RetencionDtoOut, description="Actualización de una retención por id.")
def actualizar_retencion(retencion_id: int, dto: RetencionDtoModificacion, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para actualizar una retención existente. Requiere permisos de edición.

    Args:
        retencion_id (int): El ID de la retención a actualizar.
        dto (RetencionDtoModificacion): Los datos a modificar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        RetencionDtoOut: La retención actualizada.
    """
    return RetencionService.actualizar(db, retencion_id, dto)

@router.delete("/{retencion_id}", description="Eliminación de una retención por id.")
def eliminar_retencion(retencion_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para eliminar una retención por su ID. Requiere permisos de edición.

    Args:
        retencion_id (int): El ID de la retención a eliminar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        dict: Un mensaje de confirmación.
    """
    RetencionService.eliminar(db, retencion_id)
    return {"mensaje": "Retención eliminada correctamente."}

@router.get("/arrendador/{arrendador_id}", response_model=list[RetencionDtoOut], description="Obtención de todas las retencinoes de un arrendador.")
def obtener_retenciones_arrendador(arrendador_id: int, db: Session = Depends(get_db)):
    """
    Endpoint para obtener todas las retenciones asociadas a un arrendador.

    Args:
        arrendador_id (int): El ID del arrendador.
        db (Session): La sesión de la base de datos.

    Returns:
        list[RetencionDtoOut]: Lista de retenciones del arrendador.
    """
    return RetencionService.obtener_retenciones_arrendador(db, arrendador_id)

@router.get("/facturacion/{facturacion_id}", response_model=Optional[RetencionDtoOut], description="Obtención de retención de una facturación determinada.")
def obtener_retencion_por_factura(facturacion_id: int,db: Session = Depends(get_db)):
    """
    Endpoint para obtener la retención asociada a una facturación específica.

    Args:
        facturacion_id (int): El ID de la facturación.
        db (Session): La sesión de la base de datos.

    Returns:
        Optional[RetencionDtoOut]: La retención encontrada o None si no existe.
    """
    return RetencionService.obtener_por_factura_id(db, facturacion_id)

@router.post("/configuracion")
def actualizar_configuracion(config_update: ConfiguracionDtoModificacion, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para crear o actualizar un valor de configuración del sistema.
    Requiere permisos de edición.

    Args:
        config_update (ConfiguracionDtoModificacion): La clave y el valor a actualizar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.
    """
    return RetencionService.actualizar_configuracion(db, config_update.clave, config_update.valor)

@router.get("/configuracion/destinatarios", response_model= list[str])
def obtener_destinatarios(db: Session = Depends(get_db)):
    """
    Endpoint para obtener la lista de correos electrónicos destinatarios para notificaciones.

    Args:
        db (Session): La sesión de la base de datos.

    Returns:
        list[str]: Una lista de direcciones de correo.
    """
    return RetencionService.obtener_destinatarios(db)

@router.get("/configuracion/{clave}")
def obtener_configuracion(clave: str, db: Session = Depends(get_db)):
    """
    Endpoint para obtener el valor de una clave de configuración específica.

    Args:
        clave (str): La clave de configuración a buscar.
        db (Session): La sesión de la base de datos.

    Returns:
        dict: Un objeto con la clave y su valor, o un mensaje si no se encuentra.
    """
    valor = RetencionService.obtener_configuracion(db, clave)
    if valor is None:
        return {"status": "Configuracion no encontrada", "clave": clave}
    return {"clave": clave, "valor": valor}

@router.delete("/configuracion/{clave}")
def eliminar_configuracion(clave: str, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para eliminar una clave de configuración. Requiere permisos de edición.

    Args:
        clave (str): La clave de configuración a eliminar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.
    """
    return RetencionService.eliminar_configuracion(db, clave)
