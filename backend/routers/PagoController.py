from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..util.database import get_db
from ..dtos.PagoDto import PagoDto, PagoDtoOut, PagoDtoModificacion
from ..services.PagoService import PagoService

router = APIRouter()

@router.get("/", response_model=list[PagoDtoOut], description="Obtención de todos los pagos.")
def listar_pagos(db: Session = Depends(get_db)):
    return PagoService.listar_todos(db)

@router.get("/{pago_id}", response_model=PagoDtoOut, description="Obtención un pago por id.")
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