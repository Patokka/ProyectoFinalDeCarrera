from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from model.Usuario import Usuario
from util.permisosUser import canEditDelete
from util.database import get_db
from dtos.PagoDto import PagoDto, PagoDtoOut, PagoDtoModificacion, PagoFechaEstado, PagoResumenDto, QuintalesResumenDto
from services.PagoService import PagoService

router = APIRouter()

@router.get("/resumen-quintales-proximo-mes", response_model=list[QuintalesResumenDto], description="Obtiene la suma total de quintales a entregar el próximo mes, agrupados por arrendatario.")
def obtener_resumen_quintales_proximo_mes(db: Session = Depends(get_db)):
    """
    Endpoint para obtener un resumen de los quintales a pagar en el próximo mes,
    agrupados por arrendatario.

    Args:
        db (Session): La sesión de la base de datos.

    Returns:
        list[QuintalesResumenDto]: Una lista con el resumen de quintales.
    """
    try:
        return PagoService.obtener_resumen_quintales_proximo_mes(db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/resumen-mes", response_model= list[PagoResumenDto] ,description="Obtención de resumen mensual de pagos, con la cantidad por arrendatario y el precio total.")
def obtener_pagos_agrupados_mes(db:Session = Depends(get_db)):
    """
    Endpoint para obtener un resumen de los pagos del mes actual, agrupados por
    arrendatario, incluyendo cantidad de pagos y monto total.

    Args:
        db (Session): La sesión de la base de datos.

    Returns:
        list[PagoResumenDto]: Una lista con el resumen de pagos del mes.
    """
    try:
        return PagoService.obtener_pagos_agrupados_mes(db)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/vencimientos-mes",  response_model=List[PagoFechaEstado], description="Se obtienen todas las fechas de vencimiento de los pagos de un mes determinado.")
def obtener_vencimientos_mes(mes: int, anio: int, db: Session = Depends(get_db)):
    """
    Endpoint para obtener las fechas de vencimiento y estados de los pagos para
    un mes y año específicos.

    Args:
        mes (int): El mes a consultar.
        anio (int): El año a consultar.
        db (Session): La sesión de la base de datos.

    Returns:
        List[PagoFechaEstado]: Una lista de fechas y estados de los pagos.
    """
    try:
        return PagoService.obtener_vencimientos_mes(db, mes, anio)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=list[PagoDtoOut], description="Obtención de todos los pagos.")
def listar_pagos(db: Session = Depends(get_db)):
    """
    Endpoint para listar todos los pagos existentes.

    Args:
        db (Session): La sesión de la base de datos.

    Returns:
        list[PagoDtoOut]: Una lista de todos los pagos.
    """
    return PagoService.listar_todos(db)

@router.get("/{pago_id}", response_model=PagoDtoOut, description="Obtención de un pago por id.")
def obtener_pago(pago_id: int, db: Session = Depends(get_db)):
    """
    Endpoint para obtener un pago específico por su ID.

    Args:
        pago_id (int): El ID del pago a buscar.
        db (Session): La sesión de la base de datos.

    Returns:
        PagoDtoOut: El pago encontrado.
    """
    return PagoService.obtener_por_id(db, pago_id)

@router.post("", response_model=PagoDtoOut, description="Creación de un pago.")
def crear_pago(dto: PagoDto, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para crear un nuevo pago. Requiere permisos de edición.

    Args:
        dto (PagoDto): Los datos del nuevo pago.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        PagoDtoOut: El pago recién creado.
    """
    return PagoService.crear(db, dto)

@router.put("/{pago_id}", response_model=PagoDtoOut, description="Modificación de un pago por id.")
def actualizar_pago(pago_id: int, dto: PagoDtoModificacion, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para actualizar un pago existente. Requiere permisos de edición.

    Args:
        pago_id (int): El ID del pago a actualizar.
        dto (PagoDtoModificacion): Los datos a modificar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        PagoDtoOut: El pago actualizado.
    """
    return PagoService.actualizar(db, pago_id, dto)

@router.delete("/{pago_id}", description="Eliminación de un pago por id.")
def eliminar_pago(pago_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para eliminar un pago por su ID. Requiere permisos de edición.

    Args:
        pago_id (int): El ID del pago a eliminar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        dict: Un mensaje de confirmación.
    """
    PagoService.eliminar(db, pago_id)
    return {"mensaje": "Pago eliminado correctamente."}

@router.post("/generar/{arrendamiento_id}", response_model=List[PagoDtoOut], description="Creación de los pagos de un arrendamiento.")
def generar_pagos_arrendamiento(arrendamiento_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para generar automáticamente las cuotas de pago de un arrendamiento.
    Requiere permisos de edición.

    Args:
        arrendamiento_id (int): El ID del arrendamiento para generar los pagos.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        List[PagoDtoOut]: Una lista de los pagos generados.
    """
    return  PagoService.generarCuotas(db, arrendamiento_id)

@router.put("/precio/{pago_id}", response_model=PagoDtoOut, description="Modificación del precio de un pago por id.")
def actualizar_precio_pago(pago_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para calcular y asignar el precio promedio a un pago. Requiere permisos de edición.

    Args:
        pago_id (int): El ID del pago al que se le asignará el precio.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        PagoDtoOut: El pago actualizado con el precio asignado.
    """
    return PagoService.generarPrecioCuota(db, pago_id)

@router.get("/arrendador/{arrendador_id}", response_model=list[PagoDtoOut], description="Obtención de los pagos PENDIENTES correspondientes a un arrendador.")
def obtener_pagos_pendientes_arrendador(arrendador_id: int, db: Session = Depends(get_db)):
    """
    Endpoint para obtener los pagos pendientes de un arrendador específico.

    Args:
        arrendador_id (int): El ID del arrendador.
        db (Session): La sesión de la base de datos.

    Returns:
        list[PagoDtoOut]: Lista de pagos pendientes del arrendador.
    """
    return PagoService.obtener_pendientes_arrendador(db, arrendador_id)

@router.get("/arrendamiento/{arrendamiento_id}", response_model=list[PagoDtoOut], description="Obtención de los pagos correspondientes a un arrendamiento.")
def obtener_pagos_arrendamiento(arrendamiento_id: int, db: Session = Depends(get_db)):
    """
    Endpoint para obtener todos los pagos asociados a un arrendamiento.

    Args:
        arrendamiento_id (int): El ID del arrendamiento.
        db (Session): La sesión de la base de datos.

    Returns:
        list[PagoDtoOut]: Lista de pagos del arrendamiento.
    """
    return PagoService.obtener_pagos_arrendamiento(db, arrendamiento_id)

@router.put("/cancelar/{pago_id}", response_model=PagoDtoOut, description="Cancelación de un pago por id.")
def cancelar_pago(pago_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(canEditDelete)):
    """
    Endpoint para cambiar el estado de un pago a 'CANCELADO'. Requiere permisos de edición.

    Args:
        pago_id (int): El ID del pago a cancelar.
        db (Session): La sesión de la base de datos.
        current_user (Usuario): El usuario autenticado con permisos.

    Returns:
        PagoDtoOut: El pago con su estado actualizado.
    """
    return PagoService.cancelar_pago(db, pago_id)
