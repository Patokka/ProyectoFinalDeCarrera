from fastapi import HTTPException
from sqlalchemy.orm import Session
from ..model.Facturacion import Facturacion
from backend.dtos.FacturacionDto import FacturacionDto, FacturacionDtoModificacion

class FacturacionService:

    @staticmethod
    def listar_todos(db: Session):
        return db.query(Facturacion).all()

    @staticmethod
    def obtener_por_id(db: Session, facturacion_id: int):
        obj = db.query(Facturacion).get(facturacion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Facturación no encontrada.")
        return obj

    @staticmethod
    def crear(db: Session, dto: FacturacionDto):
        nuevo = Facturacion(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar(db: Session, facturacion_id: int, dto: FacturacionDtoModificacion):
        obj = db.query(Facturacion).get(facturacion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Facturación no encontrada.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar(db: Session, facturacion_id: int):
        obj = db.query(Facturacion).get(facturacion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Facturación no encontrada.")
        db.delete(obj)
        db.commit()