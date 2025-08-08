from fastapi import HTTPException
from sqlalchemy.orm import Session
from ..model.Retencion import Retencion
from backend.dtos.RetencionDto import RetencionDto, RetencionDtoOut, RetencionDtoModificacion

class RetencionService:

    @staticmethod
    def listar_todos(db: Session):
        return db.query(Retencion).all()

    @staticmethod
    def obtener_por_id(db: Session, retencion_id: int):
        obj = db.query(Retencion).get(retencion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Retención no encontrada.")
        return obj

    @staticmethod
    def crear(db: Session, dto: RetencionDto):
        nuevo = Retencion(**dto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def actualizar(db: Session, retencion_id: int, dto: RetencionDtoModificacion):
        obj = db.query(Retencion).get(retencion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Retención no encontrada.")
        for campo, valor in dto.model_dump(exclude_unset=True).items():
            setattr(obj, campo, valor)
        db.commit()
        db.refresh(obj)
        return obj

    @staticmethod
    def eliminar(db: Session, retencion_id: int):
        obj = db.query(Retencion).get(retencion_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Retención no encontrada.")
        db.delete(obj)
        db.commit()