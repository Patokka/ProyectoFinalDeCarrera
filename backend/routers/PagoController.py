from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from util.database import get_db
from dtos.PagoDto import PagoDto, PagoDtoOut, PagoDtoModificacion, PagoResumenDto
from services.PagoService import PagoService

router = APIRouter()

@router.get("/resumen-mes", response_model= list[PagoResumenDto] ,description="Obtención de resumen mensual de pagos, con la cantidad por arrendatario y el precio total.")
def obtener_pagos_agrupados_mes(db:Session = Depends(get_db)):
    try:
        return PagoService.obtener_pagos_agrupados_mes(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vencimientos-mes", response_model=List[str], description="Se obtienen todas las fechas de vencimiento de los pagos de un mes determinado.")
def obtener_vencimientos_mes(mes: int, anio: int, db: Session = Depends(get_db)):
    try:
        return PagoService.obtener_vencimientos_mes(db, mes, anio)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=list[PagoDtoOut], description="Obtención de todos los pagos.")
def listar_pagos(db: Session = Depends(get_db)):
    return PagoService.listar_todos(db)

@router.get("/{pago_id}", response_model=PagoDtoOut, description="Obtención de un pago por id.")
def obtener_pago(pago_id: int, db: Session = Depends(get_db)):
    return PagoService.obtener_por_id(db, pago_id)

@router.post("/", response_model=PagoDtoOut, description="Creación de un pago.")
def crear_pago(dto: PagoDto, db: Session = Depends(get_db)):
    return PagoService.crear(db, dto)

@router.put("/{pago_id}", response_model=PagoDtoOut, description="Modificación de un pago por id.")
def actualizar_pago(pago_id: int, dto: PagoDtoModificacion, db: Session = Depends(get_db)):
    return PagoService.actualizar(db, pago_id, dto)

@router.delete("/{pago_id}", description="Eliminación de un pago por id.")
def eliminar_pago(pago_id: int, db: Session = Depends(get_db)):
    PagoService.eliminar(db, pago_id)
    return {"mensaje": "Pago eliminado correctamente."}


@router.post("/generar/{arrendamiento_id}", response_model=List[PagoDtoOut], description="Creación de los pagos de un arrendamiento.")
def crear_pago(arrendamiento_id: int, db: Session = Depends(get_db)):
    try:
        return  PagoService.generarCuotas(db, arrendamiento_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=e)


@router.put("/precio/{pago_id}", response_model=PagoDtoOut, description="Modificación del precio de un pago por id.")
def actualizar_precio_pago(pago_id: int, db: Session = Depends(get_db)):
    try:
        return PagoService.generarPrecioCuota(db, pago_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 

@router.get("/arrendador/{arrendador_id}", response_model=list[PagoDtoOut], description="Obtención de los pagos PENDIENTES correspondientes a un arrendador.")
def obtener_pago(arrendador_id: int, db: Session = Depends(get_db)):
    return PagoService.obtener_pendientes_arrendador(db, arrendador_id)

@router.get("/arrendamiento/{arrendamiento_id}", response_model=list[PagoDtoOut], description="Obtención de los pagos correspondientes a un arrendamiento.")
def obtener_pago(arrendamiento_id: int, db: Session = Depends(get_db)):
    return PagoService.obtener_pagos_arrendamiento(db, arrendamiento_id)