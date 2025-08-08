from fastapi import HTTPException
from sqlalchemy.orm import Session
from ..model.Pago import Pago
from ..dtos.PagoDto import PagoDto, PagoDtoOut, PagoDtoModificacion

class PagoService:

    @staticmethod
    def listar_todos(db: Session):
        return db.query(Pago).all()

    @staticmethod
    def obtener_por_id(db: Session, pago_id: int):
        obj = db.query(Pago).get(pago_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        return obj

    @staticmethod
    def crear(db: Session, dto: PagoDto):
        nuevo = Pago(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar(db: Session, pago_id: int, dto: PagoDtoModificacion):
        obj = db.query(Pago).get(pago_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar(db: Session, pago_id: int):
        obj = db.query(Pago).get(pago_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        db.delete(obj)
        db.commit()